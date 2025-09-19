import * as services from '../services/userCheckout.services.js';

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

    const result = await services.createOrderService(userId, {
      shipping_address,
      billing_address: billing_address || shipping_address,
      payment_method,
      notes,
      delivery_distance
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
