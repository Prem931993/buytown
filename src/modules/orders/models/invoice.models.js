import db from '../../../config/db.js';

export async function createInvoice(invoiceData) {
  try {
    const [id] = await db('byt_invoices').insert(invoiceData);
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getInvoicesByOrderId(orderId) {
  try {
    const invoices = await db('byt_invoices')
      .where('order_id', orderId)
      .orderBy('created_at', 'desc');
    return { success: true, invoices };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAllInvoices() {
  try {
    const invoices = await db('byt_invoices')
      .leftJoin('byt_orders', 'byt_invoices.order_id', 'byt_orders.id')
      .leftJoin('byt_users', 'byt_orders.user_id', 'byt_users.id')
      .select(
        'byt_invoices.*',
        'byt_orders.order_number',
        'byt_users.firstname',
        'byt_users.lastname',
        'byt_users.email'
      )
      .orderBy('byt_invoices.created_at', 'desc');
    return { success: true, invoices };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getInvoiceById(id) {
  try {
    const invoice = await db('byt_invoices')
      .where('id', id)
      .first();
    return { success: true, invoice };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteInvoice(id) {
  try {
    const result = await db('byt_invoices').where('id', id).del();
    return { success: true, deleted: result > 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
