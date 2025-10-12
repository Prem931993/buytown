import * as services from '../services/order.services.js';
import * as pdfServices from '../services/pdf.services.js';
import * as smsServices from '../../auth/services/sms.services.js';
import knex from '../../../config/db.js';
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
    const { vehicle_id, delivery_distance, delivery_person_id } = req.body;

    if (!vehicle_id) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle ID is required'
      });
    }

    const result = await services.approveOrder(parseInt(id), vehicle_id, delivery_distance, delivery_person_id);

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

export async function calculateDeliveryCharge(req, res) {
  try {
    const { id } = req.params;
    const { vehicle_id } = req.body;

    if (!vehicle_id) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle ID is required'
      });
    }

    const result = await services.calculateDeliveryCharge(parseInt(id), vehicle_id);

    if (result.success) {
      res.json({
        success: true,
        delivery_charge: result.delivery_charge,
        delivery_distance: result.delivery_distance,
        vehicle_rate: result.vehicle_rate,
        vehicle_name: result.vehicle_name,
        vehicle_type: result.vehicle_type
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

export async function completeOrderByDelivery(req, res) {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const deliveryPersonId = req.user.id; // Assuming user auth middleware sets req.user

    // Get delivery person details to get phone
    const deliveryPerson = await knex('byt_users').where({ id: deliveryPersonId }).first();
    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        error: 'Delivery person not found'
      });
    }

    if (otp) {
      // Verify OTP
      const otpVerification = await smsServices.verifyOtp(deliveryPerson.phone_no, otp);
      if (!otpVerification.success) {
        return res.status(400).json({
          success: false,
          error: otpVerification.error
        });
      }

      // OTP verified, complete the order
      const result = await services.completeOrderByDelivery(parseInt(id), deliveryPersonId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Order completed successfully',
          order: result.order
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } else {

      // Generate OTP
      const otp = smsServices.generateOtp();
      const otpResult = await smsServices.sendOtp(deliveryPerson.phone_no, deliveryPerson.email, otp);
      if (!otpResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to send OTP'
        });
      }

      res.json({
        success: true,
        message: 'OTP sent to your phone for order completion verification',
        otp: otp // For testing, remove in production
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function rejectOrderByDelivery(req, res) {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const deliveryPersonId = req.user.id; // Assuming user auth middleware sets req.user

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }
    const result = await services.rejectOrderByDelivery(parseInt(id), deliveryPersonId, rejection_reason);

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

export async function cancelOrderByUser(req, res) {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    const customerId = req.user.id; // Assuming user auth middleware sets req.user
    console.log("customerId", customerId)
    if (!cancellation_reason) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason is required'
      });
    }
    console.log("cancellation_reason", cancellation_reason)

    const result = await services.cancelOrderByCustomer(parseInt(id), customerId, cancellation_reason);

    if (result.success) {
      res.json({
        success: true,
        message: 'Order cancelled successfully',
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

export async function markOrderReceivedByUser(req, res) {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const customerId = req.user.id; // Assuming user auth middleware sets req.user

    // Get user details to get phone
    const user = await knex('byt_users').where({ id: customerId }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (otp) {
      // Verify OTP
      const otpVerification = await smsServices.verifyOtp(user.phone_no, otp);
      if (!otpVerification.success) {
        return res.status(400).json({
          success: false,
          error: otpVerification.error
        });
      }

      // OTP verified, complete the order
      const result = await services.markOrderReceivedByUser(parseInt(id), customerId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Order marked as received successfully',
          order: result.order
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } else {
      // Generate OTP
      const otp = smsServices.generateOtp();
      const otpResult = await smsServices.sendOtp(user.phone_no, user.email, otp);
      if (!otpResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to send OTP'
        });
      }

      res.json({
        success: true,
        message: 'OTP sent to your phone for order completion verification',
        otp: otp // For testing, remove in production
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getUserOrderById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From auth middleware

    const result = await services.getOrderById(parseInt(id));

    if (result.success) {
      if (result.order && result.order.user_id === userId) {
        res.json({
          success: true,
          order: result.order
        });
      } else {
        res.status(403).json({
          success: false,
          error: 'Unauthorized: Order does not belong to this user'
        });
      }
    } else {
      res.status(404).json({
        success: false,
        error: result.error || 'Order not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
