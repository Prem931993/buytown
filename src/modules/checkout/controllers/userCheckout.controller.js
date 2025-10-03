import * as services from '../services/userCheckout.services.js';

export async function getCheckoutInfo(req, res) {
  try {
    const userId = req.user.id;

    const result = await services.getCheckoutInfoService(userId);

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      shipping: result.shipping,
      billing: result.billing
    });
  } catch (error) {
    console.error('Error in getCheckoutInfo:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function createOrder(req, res) {
  try {
    const userId = req.user.id;
    const {
      shipping_address,
      billing_address,
      payment_method,
      notes,
      delivery_distance
    } = req.body;

    if (!shipping_address || !payment_method) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Shipping address and payment method are required'
      });
    }

    // Extract gstin from billing_address if present
    let gstin = null;
    if (billing_address && billing_address.gstin) {
      gstin = billing_address.gstin;
    }

    const result = await services.createOrderService(userId, {
      shipping_address,
      billing_address: billing_address || shipping_address,
      payment_method,
      notes,
      delivery_distance,
      gstin
    });

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      message: result.message,
      order: result.order
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function getUserOrders(req, res) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const result = await services.getUserOrdersService(userId, {
      page,
      limit,
      status
    });

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      orders: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getUserOrders:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function initiatePhonePePayment(req, res) {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ statusCode: 400, error: 'Order ID is required' });
    }

    const paymentResponse = await services.initiatePhonePePayment(userId, orderId);

    if (paymentResponse.error) {
      return res.status(paymentResponse.status).json({ statusCode: paymentResponse.status, error: paymentResponse.error });
    }

    res.status(200).json({
      statusCode: 200,
      paymentUrl: paymentResponse.paymentUrl,
      transactionId: paymentResponse.transactionId
    });
  } catch (error) {
    console.error('Error in initiatePhonePePayment:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function handlePhonePeCallback(req, res) {
  try {
    const callbackData = await services.handlePhonePeCallback(req);

    res.status(200).json({ statusCode: 200, message: 'Callback processed', data: callbackData });
  } catch (error) {
    console.error('Error in handlePhonePeCallback:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

export async function getPhonePePaymentStatus(req, res) {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({ statusCode: 400, error: 'Transaction ID is required' });
    }

    const statusResponse = await services.verifyPhonePePayment(transactionId);

    if (statusResponse.error) {
      return res.status(statusResponse.status).json({ statusCode: statusResponse.status, error: statusResponse.error });
    }

    res.status(200).json({
      statusCode: 200,
      paymentStatus: statusResponse.paymentStatus
    });
  } catch (error) {
    console.error('Error in getPhonePePaymentStatus:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}
