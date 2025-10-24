import * as paymentConfigModels from '../../config/models/payment.models.js';

// Get available payment methods for users
export async function getPaymentMethods() {
  try {
    // Get all active payment configurations
    const configs = await paymentConfigModels.getAllPaymentConfigurations();

    // Filter only active configurations and return user-safe details
    const activeConfigs = configs.filter(config => config.is_active);

    // Transform to user-friendly format
    const paymentMethods = activeConfigs.map(config => ({
      id: config.id,
      gateway: config.gateway_name,
      name: getPaymentMethodDisplayName(config.gateway_name),
      currency: config.currency,
      isSandbox: config.is_sandbox,
      description: config.description || getPaymentMethodDescription(config.gateway_name)
    }));

    return {
      paymentMethods,
      status: 200
    };
  } catch (error) {
    console.error('Error in getPaymentMethods:', error);
    return { error: error.message, status: 500 };
  }
}

// Helper function to get display name for payment methods
function getPaymentMethodDisplayName(gatewayName) {
  const displayNames = {
    'cashfree': 'Cashfree Payments',
    'phonepe': 'PhonePe',
    'razorpay': 'Razorpay',
    'paytm': 'Paytm',
    'stripe': 'Stripe'
  };

  return displayNames[gatewayName] || gatewayName.charAt(0).toUpperCase() + gatewayName.slice(1);
}

// Helper function to get description for payment methods
function getPaymentMethodDescription(gatewayName) {
  const descriptions = {
    'cashfree': 'Secure payment gateway supporting credit cards, debit cards, UPI, and net banking',
    'phonepe': 'Popular UPI payment method',
    'razorpay': 'Comprehensive payment solution with multiple payment options',
    'paytm': 'Digital wallet and payment gateway',
    'stripe': 'Global payment processing platform'
  };

  return descriptions[gatewayName] || 'Secure payment method';
}
