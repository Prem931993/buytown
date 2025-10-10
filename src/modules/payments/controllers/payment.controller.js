import * as cashfreeServices from '../services/cashfree.services.js';
import * as paymentModels from '../models/payment.models.js';

// Create Cashfree order controller
export async function createCashfreeOrderController(req, res) {
  try {
    const orderData = req.body;

    if (!orderData.order_id || !orderData.order_amount || !orderData.customer_details) {
      return res.status(400).json({ error: 'Missing required fields: order_id, order_amount, customer_details' });
    }

    const result = await cashfreeServices.createCashfreeOrder(orderData);

    if (result.success) {
      return res.status(201).json({
        message: 'Cashfree order created successfully',
        cashfreeOrderId: result.cashfreeOrderId,
        paymentLink: result.paymentLink,
        data: result.data
      });
    } else {
      return res.status(500).json({ error: result.error || 'Failed to create Cashfree order' });
    }
  } catch (error) {
    console.error('Error in createCashfreeOrderController:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Verify Cashfree payment controller
export async function verifyCashfreePaymentController(req, res) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId parameter' });
    }

    const result = await cashfreeServices.verifyCashfreePayment(orderId);

    if (result.success) {
      return res.status(200).json({
        message: 'Cashfree payment verified successfully',
        status: result.status,
        data: result.data
      });
    } else {
      return res.status(500).json({ error: result.error || 'Failed to verify Cashfree payment' });
    }
  } catch (error) {
    console.error('Error in verifyCashfreePaymentController:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handle Cashfree webhook controller
export async function handleCashfreeWebhookController(req, res) {
  try {
    const webhookData = req.body;

    const result = await cashfreeServices.handleCashfreeWebhook(webhookData);

    if (result.success) {
      return res.status(200).json({ message: 'Webhook processed successfully' });
    } else {
      return res.status(400).json({ error: result.error || 'Failed to process webhook' });
    }
  } catch (error) {
    console.error('Error in handleCashfreeWebhookController:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Get payment details controller
export async function getPaymentDetailsController(req, res) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId parameter' });
    }

    const result = await cashfreeServices.getPaymentDetails(orderId);

    if (result.success) {
      return res.status(200).json({ payment: result.payment });
    } else {
      return res.status(404).json({ error: result.error || 'Payment not found' });
    }
  } catch (error) {
    console.error('Error in getPaymentDetailsController:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Refund payment controller
export async function refundCashfreePaymentController(req, res) {
  try {
    const { orderId } = req.params;
    const { refundAmount, refundReason } = req.body;

    if (!orderId || !refundAmount) {
      return res.status(400).json({ error: 'Missing required fields: orderId, refundAmount' });
    }

    const result = await cashfreeServices.refundCashfreePayment(orderId, refundAmount, refundReason);

    if (result.success) {
      return res.status(200).json({
        message: 'Refund initiated successfully',
        refundId: result.refundId,
        data: result.data
      });
    } else {
      return res.status(500).json({ error: result.error || 'Failed to initiate refund' });
    }
  } catch (error) {
    console.error('Error in refundCashfreePaymentController:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
