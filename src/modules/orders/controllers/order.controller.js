import * as services from '../services/order.services.js';
import * as pdfServices from '../services/pdf.services.js';
import fs from 'fs';
import path from 'path';

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

export async function approveOrder(req, res) {
  try {
    const { id } = req.params;
    const { delivery_person_id, delivery_distance } = req.body;
    const result = await services.approveOrder(parseInt(id), delivery_person_id, delivery_distance);

    if (result.success) {
      res.json({
        success: true,
        message: 'Order approved successfully',
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

export async function rejectOrder(req, res) {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const result = await services.rejectOrder(parseInt(id), rejection_reason);

    if (result.success) {
      res.json({
        success: true,
        message: 'Order rejected successfully',
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

export async function assignDeliveryPerson(req, res) {
  try {
    const { id } = req.params;
    const { delivery_person_id, delivery_distance } = req.body;
    const result = await services.assignDeliveryPerson(parseInt(id), delivery_person_id, delivery_distance);

    if (result.success) {
      res.json({
        success: true,
        message: 'Delivery person assigned successfully',
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

export async function markOrderCompleted(req, res) {
  try {
    const { id } = req.params;
    const result = await services.markOrderCompleted(parseInt(id));

    if (result.success) {
      res.json({
        success: true,
        message: 'Order marked as completed successfully',
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

// PDF Generation Controllers
export async function generateInvoicePDF(req, res) {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    const fileName = `invoice_${orderId}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');

    await pdfServices.generateInvoicePDF(orderId, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

export async function generateOrderConfirmationPDF(req, res) {
  try {
    const { id } = req.params;
    const result = await pdfServices.generateOrderConfirmationPDF(parseInt(id));

    if (result.success) {
      res.json({
        success: true,
        message: 'Order confirmation PDF generated successfully',
        fileName: result.fileName,
        filePath: result.filePath,
        fileSize: result.fileSize,
        invoiceId: result.invoiceId
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

export async function getInvoicesByOrder(req, res) {
  try {
    const { id } = req.params;
    const result = await pdfServices.getInvoicesByOrder(parseInt(id));

    if (result.success) {
      res.json({
        success: true,
        invoices: result.invoices
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

export async function getAllInvoices(req, res) {
  try {
    const result = await pdfServices.getAllInvoices();

    if (result.success) {
      res.json({
        success: true,
        invoices: result.invoices
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
