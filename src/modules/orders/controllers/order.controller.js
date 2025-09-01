import * as services from '../services/order.services.js';

export async function createOrder(req, res) {
  try {
    const orderData = req.body;
    const result = await services.createOrder(orderData);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: result.order
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const result = await services.getOrderById(parseInt(id));

    if (result.success) {
      if (result.order) {
        res.json({
          success: true,
          order: result.order
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getAllOrders(req, res) {
  try {
    const result = await services.getAllOrders();

    if (result.success) {
      res.json({
        success: true,
        orders: result.orders
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function updateOrder(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const result = await services.updateOrder(parseInt(id), updateData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Order updated successfully',
        order: result.order
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function deleteOrder(req, res) {
  try {
    const { id } = req.params;
    const result = await services.deleteOrder(parseInt(id));

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getOrdersByStatus(req, res) {
  try {
    const { status } = req.params;
    const result = await services.getOrdersByStatus(status);

    if (result.success) {
      res.json({
        success: true,
        orders: result.orders
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getOrdersByUser(req, res) {
  try {
    const { userId } = req.params;
    const result = await services.getOrdersByUser(parseInt(userId));

    if (result.success) {
      res.json({
        success: true,
        orders: result.orders
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
