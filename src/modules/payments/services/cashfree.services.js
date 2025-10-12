import axios from 'axios';
import crypto from 'crypto';
import knex from '../../../config/db.js';
import * as paymentModels from '../../config/models/payment.models.js';

// Get Cashfree configuration from database
async function getCashfreeConfig() {
  try {
    const config = await paymentModels.getPaymentConfiguration('cashfree');

    if (!config || !config.is_active) {
      throw new Error('Cashfree payment gateway is not configured or inactive');
    }

    return {
      APP_ID: config.api_key,
      SECRET_KEY: config.api_secret,
      BASE_URL: (config.is_sandbox ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg'),
      VERSION: '2025-01-01',
      WEBHOOK_SECRET: config.webhook_secret,
      IS_SANDBOX: config.is_sandbox,
      CURRENCY: config.currency || 'INR'
    };
  } catch (error) {
    console.error('Error getting Cashfree config from database:', error.message);
    throw error;
  }
}

// Cache config to avoid multiple DB calls
let CASHFREE_CONFIG_CACHE = null;

// Initialize config
async function initializeCashfreeConfig() {
  if (!CASHFREE_CONFIG_CACHE) {
    CASHFREE_CONFIG_CACHE = await getCashfreeConfig();
  }
  return CASHFREE_CONFIG_CACHE;
}

// Generate unique order ID for Cashfree
function generateCashfreeOrderId(orderId) {
  return `CF_${orderId}_${Date.now()}`;
}

// Create signature for Cashfree API requests
function generateSignature(data, secretKey) {
  const sortedKeys = Object.keys(data).sort();
  let signatureString = '';

  sortedKeys.forEach(key => {
    if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
      signatureString += `${key}${data[key]}`;
    }
  });

  return crypto.createHmac('sha256', secretKey).update(signatureString).digest('base64');
}

// Create Cashfree order
export async function createCashfreeOrder(orderData) {
  try {
    const config = await initializeCashfreeConfig();

    const {
      order_id,
      order_amount,
      order_currency = 'INR',
      customer_details,
      order_meta = {},
      order_tags = {}
    } = orderData;

    const cashfreeOrderId = generateCashfreeOrderId(order_id);

    const payload = {
      order_id: cashfreeOrderId,
      order_amount: parseFloat(order_amount).toFixed(2),
      order_currency,
      customer_details,
      order_meta: {
        return_url: `https://buytown-production.up.railway.app/api/v1/payments/cashfree/verify/${order_id}`,
        notify_url: `https://buytown-production.up.railway.app/api/v1/payments/cashfree/webhook`,
        payment_methods: "cc,dc,upi"
      },
      order_tags
    };

    // Create signature
    const signature = generateSignature(payload, config.SECRET_KEY);

    const headers = {
      'Content-Type': 'application/json',
      'x-api-version': config.VERSION,
      'x-client-id': config.APP_ID,
      'x-client-secret': config.SECRET_KEY
    };

    const response = await axios.post(
      `${config.BASE_URL}/orders`,
      payload,
      { headers }
    );

    // Store payment details in database
    await knex('byt_payments').insert({
      order_id: order_id,
      payment_gateway: 'cashfree',
      gateway_order_id: cashfreeOrderId,
      amount: order_amount,
      currency: order_currency,
      status: response.data.order_status || 'created',
      gateway_response: JSON.stringify(response.data),
      created_at: knex.fn.now()
    });

    return {
      success: true,
      cashfreeOrderId,
      paymentLink: response.data.payment_link,
      data: response.data
    };

  } catch (error) {
    console.error('Error creating Cashfree order:', error.response?.data || error.message);

    // Generate order ID for failed payment record
    const cashfreeOrderId = generateCashfreeOrderId(orderData.order_id);

    // Store failed payment attempt
    await knex('byt_payments').insert({
      order_id: orderData.order_id,
      payment_gateway: 'cashfree',
      gateway_order_id: cashfreeOrderId,
      amount: orderData.order_amount,
      currency: orderData.order_currency || 'INR',
      status: 'failed',
      error_message: error.response?.data?.message || error.message,
      gateway_response: JSON.stringify(error.response?.data || {}),
      created_at: knex.fn.now()
    });

    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// Verify Cashfree payment
export async function verifyCashfreePayment(orderId) {
  try {
    const config = await initializeCashfreeConfig();

    // Get payment record from database
    const payment = await knex('byt_payments')
      .where({ order_id: orderId, payment_gateway: 'cashfree' })
      .orderBy('created_at', 'desc')
      .first();

    if (!payment) {
      return { success: false, error: 'Payment record not found' };
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-api-version': config.VERSION,
      'x-client-id': config.APP_ID,
      'x-client-secret': config.SECRET_KEY
    };

    const response = await axios.get(
      `${config.BASE_URL}/orders/${payment.gateway_order_id}`,
      { headers }
    );

    const paymentData = response.data;

    // Update payment status in database
    await knex('byt_payments')
      .where({ id: payment.id })
      .update({
        status: paymentData.order_status,
        gateway_response: JSON.stringify(paymentData),
        updated_at: knex.fn.now()
      });

    // Update order payment status if payment is successful
    if (paymentData.order_status === 'PAID') {
      await knex('byt_orders')
        .where({ id: orderId })
        .update({
          payment_status: 'completed',
          status: 'awaiting_confirmation', // Move to confirmed status
          updated_at: knex.fn.now()
        });
    } else if (['CANCELLED', 'FAILED'].includes(paymentData.order_status)) {
      await knex('byt_orders')
        .where({ id: orderId })
        .update({
          payment_status: 'failed',
          status: 'cancelled',
          updated_at: knex.fn.now()
        });
    }

    return {
      success: true,
      status: paymentData.order_status,
      data: paymentData
    };

  } catch (error) {
    console.error('Error verifying Cashfree payment:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// Handle Cashfree webhook
export async function handleCashfreeWebhook(webhookData) {
  try {
    const config = await initializeCashfreeConfig();
    const { orderId, orderStatus, paymentStatus, signature } = webhookData;

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(webhookData, config.SECRET_KEY);

    if (!isValidSignature) {
      return { success: false, error: 'Invalid webhook signature' };
    }

    // Find payment record
    const payment = await knex('byt_payments')
      .where({ gateway_order_id: orderId, payment_gateway: 'cashfree' })
      .first();

    if (!payment) {
      return { success: false, error: 'Payment record not found' };
    }
    // Update payment status
    await knex('byt_payments')
      .where({ id: payment.id })
      .update({
        status: orderStatus,
        gateway_response: JSON.stringify(webhookData),
        updated_at: knex.fn.now()
      });

    // Update order status based on payment status
    if (orderStatus === 'PAID' && paymentStatus === 'SUCCESS') {
      await knex('byt_orders')
        .where({ id: payment.order_id })
        .update({
          payment_status: 'completed',
          status: 'awaiting_confirmation',
          updated_at: knex.fn.now()
        });
    } else if (['CANCELLED', 'FAILED'].includes(orderStatus)) {
      await knex('byt_orders')
        .where({ id: payment.order_id })
        .update({
          payment_status: 'failed',
          status: 'cancelled',
          updated_at: knex.fn.now()
        });
    }

    return { success: true, message: 'Webhook processed successfully' };

  } catch (error) {
    console.error('Error handling Cashfree webhook:', error);
    return { success: false, error: error.message };
  }
}

// Verify webhook signature
function verifyWebhookSignature(data, secretKey) {
  try {
    const { signature: receivedSignature, ...payload } = data;
    const expectedSignature = generateSignature(payload, secretKey);
    return expectedSignature === receivedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Get payment details
export async function getPaymentDetails(orderId) {
  try {
    const payment = await knex('byt_payments')
      .where({ order_id: orderId, payment_gateway: 'cashfree' })
      .orderBy('created_at', 'desc')
      .first();

    if (!payment) {
      return { success: false, error: 'Payment record not found' };
    }

    return {
      success: true,
      payment: {
        id: payment.id,
        order_id: payment.order_id,
        gateway_order_id: payment.gateway_order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        gateway_response: JSON.parse(payment.gateway_response || '{}'),
        created_at: payment.created_at,
        updated_at: payment.updated_at
      }
    };

  } catch (error) {
    console.error('Error getting payment details:', error);
    return { success: false, error: error.message };
  }
}

// Refund payment
export async function refundCashfreePayment(orderId, refundAmount, refundReason = '') {
  try {
    const config = await initializeCashfreeConfig();

    // Get payment record
    const payment = await knex('byt_payments')
      .where({ order_id: orderId, payment_gateway: 'cashfree' })
      .orderBy('created_at', 'desc')
      .first();

    if (!payment) {
      return { success: false, error: 'Payment record not found' };
    }

    if (payment.status !== 'PAID') {
      return { success: false, error: 'Payment is not in paid status' };
    }

    const refundPayload = {
      refund_id: `REF_${orderId}_${Date.now()}`,
      refund_amount: parseFloat(refundAmount).toFixed(2),
      refund_reason: refundReason || 'Customer requested refund'
    };

    const headers = {
      'Content-Type': 'application/json',
      'x-api-version': config.VERSION,
      'x-client-id': config.APP_ID,
      'x-client-secret': config.SECRET_KEY
    };

    const response = await axios.post(
      `${config.BASE_URL}/orders/${payment.gateway_order_id}/refunds`,
      refundPayload,
      { headers }
    );

    // Store refund record
    await knex('byt_payment_refunds').insert({
      payment_id: payment.id,
      refund_id: refundPayload.refund_id,
      amount: refundAmount,
      reason: refundReason,
      gateway_response: JSON.stringify(response.data),
      status: 'initiated',
      created_at: knex.fn.now()
    });

    return {
      success: true,
      refundId: refundPayload.refund_id,
      data: response.data
    };

  } catch (error) {
    console.error('Error processing refund:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}
