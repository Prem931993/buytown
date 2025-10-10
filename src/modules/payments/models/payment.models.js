import knex from '../../../config/db.js';

// Create payments table if it doesn't exist
export async function createPaymentsTable() {
  const exists = await knex.schema.hasTable('byt_payments');
  if (!exists) {
    await knex.schema.createTable('byt_payments', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable().references('id').inTable('byt_orders').onDelete('CASCADE');
      table.string('payment_gateway').notNullable(); // 'cashfree', 'phonepe', etc.
      table.string('gateway_order_id').notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('INR');
      table.string('status').notNullable(); // 'created', 'pending', 'paid', 'failed', 'cancelled'
      table.text('gateway_response').nullable();
      table.string('error_message').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['order_id', 'payment_gateway']);
      table.index('gateway_order_id');
    });
  }
}

// Create payment refunds table if it doesn't exist
export async function createPaymentRefundsTable() {
  const exists = await knex.schema.hasTable('byt_payment_refunds');
  if (!exists) {
    await knex.schema.createTable('byt_payment_refunds', (table) => {
      table.increments('id').primary();
      table.integer('payment_id').unsigned().notNullable().references('id').inTable('byt_payments').onDelete('CASCADE');
      table.string('refund_id').notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.string('reason').nullable();
      table.string('status').notNullable(); // 'initiated', 'processed', 'failed'
      table.text('gateway_response').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index('payment_id');
      table.index('refund_id');
    });
  }
}

// Payment CRUD operations
export async function createPayment(paymentData) {
  try {
    const [payment] = await knex('byt_payments').insert(paymentData).returning('*');
    return payment;
  } catch (error) {
    throw new Error(`Failed to create payment: ${error.message}`);
  }
}

export async function getPaymentById(id) {
  try {
    return await knex('byt_payments').where({ id }).first();
  } catch (error) {
    throw new Error(`Failed to get payment: ${error.message}`);
  }
}

export async function getPaymentByOrderId(orderId, gateway = null) {
  try {
    let query = knex('byt_payments').where({ order_id: orderId });
    if (gateway) {
      query = query.andWhere({ payment_gateway: gateway });
    }
    return await query.orderBy('created_at', 'desc').first();
  } catch (error) {
    throw new Error(`Failed to get payment by order ID: ${error.message}`);
  }
}

export async function getPaymentByGatewayOrderId(gatewayOrderId) {
  try {
    return await knex('byt_payments').where({ gateway_order_id: gatewayOrderId }).first();
  } catch (error) {
    throw new Error(`Failed to get payment by gateway order ID: ${error.message}`);
  }
}

export async function updatePayment(id, updateData) {
  try {
    const [payment] = await knex('byt_payments')
      .where({ id })
      .update({ ...updateData, updated_at: knex.fn.now() })
      .returning('*');
    return payment;
  } catch (error) {
    throw new Error(`Failed to update payment: ${error.message}`);
  }
}

export async function getPaymentsByUserId(userId, options = {}) {
  try {
    const { page = 1, limit = 10, status, gateway } = options;

    let query = knex('byt_payments as p')
      .join('byt_orders as o', 'p.order_id', 'o.id')
      .where('o.user_id', userId)
      .select(
        'p.*',
        'o.order_number',
        'o.total_amount as order_total',
        'o.status as order_status'
      );

    if (status) {
      query = query.andWhere('p.status', status);
    }

    if (gateway) {
      query = query.andWhere('p.payment_gateway', gateway);
    }

    const totalCount = await query.clone().count('p.id as count').first();
    const total = parseInt(totalCount.count, 10);

    const payments = await query
      .orderBy('p.created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(`Failed to get payments by user ID: ${error.message}`);
  }
}

// Refund CRUD operations
export async function createRefund(refundData) {
  try {
    const [refund] = await knex('byt_payment_refunds').insert(refundData).returning('*');
    return refund;
  } catch (error) {
    throw new Error(`Failed to create refund: ${error.message}`);
  }
}

export async function getRefundById(id) {
  try {
    return await knex('byt_payment_refunds').where({ id }).first();
  } catch (error) {
    throw new Error(`Failed to get refund: ${error.message}`);
  }
}

export async function getRefundsByPaymentId(paymentId) {
  try {
    return await knex('byt_payment_refunds')
      .where({ payment_id: paymentId })
      .orderBy('created_at', 'desc');
  } catch (error) {
    throw new Error(`Failed to get refunds by payment ID: ${error.message}`);
  }
}

export async function updateRefund(id, updateData) {
  try {
    const [refund] = await knex('byt_payment_refunds')
      .where({ id })
      .update({ ...updateData, updated_at: knex.fn.now() })
      .returning('*');
    return refund;
  } catch (error) {
    throw new Error(`Failed to update refund: ${error.message}`);
  }
}

// Get payment statistics
export async function getPaymentStats(options = {}) {
  try {
    const { startDate, endDate, gateway } = options;

    let query = knex('byt_payments');

    if (gateway) {
      query = query.where({ payment_gateway: gateway });
    }

    if (startDate && endDate) {
      query = query.whereBetween('created_at', [startDate, endDate]);
    }

    const stats = await query
      .select(
        'status',
        knex.raw('COUNT(*) as count'),
        knex.raw('SUM(amount) as total_amount')
      )
      .groupBy('status');

    return stats;
  } catch (error) {
    throw new Error(`Failed to get payment stats: ${error.message}`);
  }
}

// Get refund statistics
export async function getRefundStats(options = {}) {
  try {
    const { startDate, endDate } = options;

    let query = knex('byt_payment_refunds');

    if (startDate && endDate) {
      query = query.whereBetween('created_at', [startDate, endDate]);
    }

    const stats = await query
      .select(
        'status',
        knex.raw('COUNT(*) as count'),
        knex.raw('SUM(amount) as total_amount')
      )
      .groupBy('status');

    return stats;
  } catch (error) {
    throw new Error(`Failed to get refund stats: ${error.message}`);
  }
}
