import axios from 'axios';
import crypto from 'crypto';
import knex from '../../../config/db.js';

const PHONEPE_BASE_URL = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';
const PHONEPE_SALT = process.env.PHONEPE_SALT || '';
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || '';
const PHONEPE_CALLBACK_URL = process.env.PHONEPE_CALLBACK_URL || '';
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';

function generateChecksum(payload, endpoint) {
  // PhonePe checksum generation: SHA256(base64(payload) + endpoint + salt) + ### + saltIndex
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const stringToHash = base64Payload + endpoint + PHONEPE_SALT;
  const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  return hash + '###' + PHONEPE_SALT_INDEX;
}

export async function initiatePayment(order) {
  const payload = {
    merchantId: PHONEPE_MERCHANT_ID,
    merchantTransactionId: order.order_number,
    merchantUserId: order.user_id.toString(),
    amount: Math.round(order.total_amount * 100), // amount in paise, ensure integer
    redirectUrl: PHONEPE_CALLBACK_URL,
    redirectMode: 'REDIRECT',
    callbackUrl: PHONEPE_CALLBACK_URL,
    mobileNumber: order.shipping_address?.phone || '',
    paymentInstrument: {
      type: 'PAY_PAGE'
    }
  };

  const endpoint = '/pg/v1/pay';
  const checksum = generateChecksum(payload, endpoint);

  try {
    const response = await axios.post(`${PHONEPE_BASE_URL}${endpoint}`, {
      request: Buffer.from(JSON.stringify(payload)).toString('base64')
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      }
    });

    if (response.data.success) {
      return {
        success: true,
        paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
        transactionId: order.order_number
      };
    } else {
      throw new Error(response.data.message || 'Payment initiation failed');
    }
  } catch (error) {
    console.error('PhonePe payment initiation error:', error.response?.data || error.message);
    throw new Error('PhonePe payment initiation failed: ' + (error.response?.data?.message || error.message));
  }
}

export async function verifyPayment(transactionId) {
  const payload = {
    merchantId: PHONEPE_MERCHANT_ID,
    merchantTransactionId: transactionId
  };

  const endpoint = '/pg/v1/status';
  const checksum = generateChecksum(payload, endpoint);

  try {
    const response = await axios.post(`${PHONEPE_BASE_URL}${endpoint}`, {
      request: Buffer.from(JSON.stringify(payload)).toString('base64')
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      }
    });

    if (response.data.success) {
      const paymentData = response.data;
      return {
        success: true,
        status: paymentData.code,
        paymentStatus: paymentData.data?.state || 'UNKNOWN',
        transactionId: paymentData.data?.transactionId,
        amount: paymentData.data?.amount / 100 // convert back to rupees
      };
    } else {
      return {
        success: false,
        status: response.data.code,
        message: response.data.message
      };
    }
  } catch (error) {
    console.error('PhonePe payment verification error:', error.response?.data || error.message);
    throw new Error('PhonePe payment verification failed: ' + (error.response?.data?.message || error.message));
  }
}

export async function handleCallback(callbackData) {
  try {
    // Verify callback checksum
    const receivedChecksum = callbackData.checksum;
    const payload = callbackData.response;
    const endpoint = '/pg/v1/pay/notify';
    const expectedChecksum = generateChecksum(JSON.parse(atob(payload)), endpoint);

    if (receivedChecksum !== expectedChecksum) {
      throw new Error('Invalid callback checksum');
    }

    const decodedResponse = JSON.parse(atob(payload));

    if (decodedResponse.success) {
      const transactionId = decodedResponse.data.merchantTransactionId;
      const paymentStatus = decodedResponse.data.state;

      // Update order status in database
      let orderStatus = 'awaiting_confirmation'; // default
      let paymentStatusDb = 'pending';

      if (paymentStatus === 'COMPLETED') {
        paymentStatusDb = 'paid';
        orderStatus = 'confirmed'; // or keep as awaiting_confirmation until admin approval
      } else if (paymentStatus === 'FAILED') {
        paymentStatusDb = 'failed';
      }

      await knex('byt_orders')
        .where('order_number', transactionId)
        .update({
          payment_status: paymentStatusDb,
          status: orderStatus,
          updated_at: knex.fn.now()
        });

      return {
        success: true,
        transactionId,
        paymentStatus,
        orderStatus
      };
    } else {
      throw new Error('Payment failed: ' + decodedResponse.message);
    }
  } catch (error) {
    console.error('PhonePe callback handling error:', error);
    throw error;
  }
}
