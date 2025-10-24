import * as paymentMethodService from '../services/paymentMethod.services.js';

// Get available payment methods for users
export async function getPaymentMethods(req, res) {
  try {
    const result = await paymentMethodService.getPaymentMethods();

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      paymentMethods: result.paymentMethods
    });
  } catch (error) {
    console.error('Error in getPaymentMethods:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}
