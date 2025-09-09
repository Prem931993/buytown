import * as invoiceModels from '../models/invoice.models.js';
import db from '../../../config/db.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Theme colors
const COLORS = {
  primary: '#e57373',    // light red
  secondary: '#81c784',  // light green
  text: '#000000',
  gray: '#f5f5f5'
};

// Font paths
const FONT_PATHS = {
  regular: path.join(process.cwd(), 'assets/fonts/NotoSans-Regular.ttf'),
  bold: path.join(process.cwd(), 'assets/fonts/NotoSans-Bold.ttf')
};

// ------------------------- Helpers -------------------------

// Header
function addHeader(doc) {
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary);
  doc.fillColor('#fff').font('Bold').fontSize(20).text('BuyTown E-commerce', 50, 30);
  doc.font('Regular').fontSize(10).text('123 Business Street, City, State 12345 | Phone: (555) 123-4567', 50, 55);
  doc.fillColor(COLORS.text);
}

// Footer
function addFooter(doc) {
  const footerY = doc.page.height - 50;
  doc.rect(0, footerY, doc.page.width, 50).fill(COLORS.gray);
  doc.fillColor(COLORS.text).font('Regular').fontSize(10)
    .text('Thank you for shopping with BuyTown! | support@buytown.com', 50, footerY + 20, {
      align: 'center',
      width: doc.page.width - 100
    });
}

// ✅ Safe Watermark
function addWatermark(doc) {
  const text = 'BuyTown';
  doc.save();
  doc.font('Bold').fontSize(100).fillColor('#000').opacity(0.05);
  doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
  doc.text(text, doc.page.width / 4, doc.page.height / 3, {
    align: 'center',
    width: 400
  });
  doc.restore(); // restore graphics state
  doc.opacity(1).fillColor(COLORS.text);
}

// ------------------------- DB Fetcher -------------------------

async function getOrderDetails(orderId) {
  try {
    const orderRows = await db('byt_orders')
      .leftJoin('byt_users', 'byt_orders.user_id', 'byt_users.id')
      .leftJoin('byt_order_items', 'byt_orders.id', 'byt_order_items.order_id')
      .leftJoin('byt_products', 'byt_order_items.product_id', 'byt_products.id')
      .leftJoin('byt_product_variations', 'byt_order_items.variation_id', 'byt_product_variations.id')
      .leftJoin('byt_variations', 'byt_product_variations.variation_id', 'byt_variations.id')
      .where('byt_orders.id', orderId)
      .select(
        'byt_orders.*',
        'byt_users.firstname',
        'byt_users.lastname',
        'byt_users.email',
        'byt_users.phone_no',
        'byt_order_items.id as item_id',
        'byt_order_items.quantity',
        'byt_order_items.price as item_price',
        'byt_order_items.total_price as item_total',
        'byt_products.name as product_name',
        'byt_products.sku_code as product_sku',
        'byt_variations.label as variation_name'
      );

    if (!orderRows.length) return null;

    const firstRow = orderRows[0];

    let shippingAddress = null;
    let billingAddress = null;
    try {
      if (firstRow.shipping_address) shippingAddress = JSON.parse(firstRow.shipping_address);
      if (firstRow.billing_address) billingAddress = JSON.parse(firstRow.billing_address);
    } catch (e) {
      console.warn('Error parsing address JSON:', e);
    }

    const orderDetails = {
      id: firstRow.id,
      order_number: firstRow.order_number,
      customer: {
        name: `${firstRow.firstname || ''} ${firstRow.lastname || ''}`.trim() || 'N/A',
        email: firstRow.email || 'N/A',
        phone: firstRow.phone_no || 'N/A'
      },
      orderDate: firstRow.created_at ? new Date(firstRow.created_at).toISOString() : new Date().toISOString(),
      status: firstRow.status || 'Pending',
      paymentMethod: firstRow.payment_method || 'N/A',
      subtotal: parseFloat(firstRow.subtotal) || 0,
      shippingCost: parseFloat(firstRow.shipping_amount) || 0,
      tax: parseFloat(firstRow.tax_amount) || 0,
      discount: parseFloat(firstRow.discount_amount) || 0,
      total: parseFloat(firstRow.total_amount) || 0,
      deliveryCharges: parseFloat(firstRow.delivery_charges) || 0,
      shippingAddress,
      billingAddress,
      items: []
    };

    orderRows.forEach(row => {
      if (row.item_id) {
        orderDetails.items.push({
          id: row.item_id,
          name: row.product_name || 'Unknown Product',
          sku: row.product_sku || 'N/A',
          price: parseFloat(row.item_price) || 0,
          quantity: row.quantity || 0,
          total: parseFloat(row.item_total) || 0
        });
      }
    });

    return orderDetails;
  } catch (error) {
    throw error;
  }
}

// ------------------------- Renderer -------------------------

function renderInvoice(doc, order, title = 'INVOICE') {
  addHeader(doc);
  addWatermark(doc);

  // Title
  doc.fillColor(COLORS.text).font('Bold').fontSize(22).text(title, 50, 100);

  // Customer Info
  doc.font('Regular').fontSize(12);
  doc.rect(50, 140, 250, 100).stroke('#ccc');
  doc.text('Customer Information', 60, 150, { underline: true });
  doc.text(order.customer.name, 60, 170);
  doc.text(order.customer.email, 60, 185);
  doc.text(order.customer.phone, 60, 200);

  // Order Info
  doc.rect(320, 140, 220, 100).stroke('#ccc');
  doc.text(`Invoice #: ${order.order_number}`, 330, 150);
  doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 330, 165);
  doc.text(`Status: ${order.status}`, 330, 180);
  doc.text(`Payment: ${order.paymentMethod}`, 330, 195);

  // Items Table Header
  let tableTop = 270;
  doc.rect(50, tableTop, 490, 25).fill(COLORS.primary).fillColor('#fff').font('Bold').fontSize(12);
  doc.text('Item', 60, tableTop + 7);
  doc.text('Qty', 300, tableTop + 7);
  doc.text('Price (₹)', 360, tableTop + 7);
  doc.text('Total (₹)', 450, tableTop + 7);

  // Items Rows
  doc.fillColor(COLORS.text).font('Regular');
  let y = tableTop + 30;
  order.items.forEach((item, idx) => {
    if (idx % 2 === 0) {
      doc.rect(50, y - 5, 490, 20).fill(COLORS.gray).fillColor(COLORS.text);
    }
    doc.text(item.name, 60, y);
    doc.text(item.quantity.toString(), 300, y);
    doc.text(`₹${item.price.toFixed(2)}`, 360, y);
    doc.text(`₹${item.total.toFixed(2)}`, 450, y);
    y += 20;
  });

  // Totals
  y += 20;
  doc.fontSize(12);
  doc.text(`Subtotal: ₹${order.subtotal.toFixed(2)}`, 360, y);
  y += 15; doc.text(`Shipping: ₹${order.shippingCost.toFixed(2)}`, 360, y);
  y += 15; doc.text(`Tax: ₹${order.tax.toFixed(2)}`, 360, y);
  y += 15; doc.text(`Delivery: ₹${order.deliveryCharges.toFixed(2)}`, 360, y);
  y += 15; doc.text(`Discount: -₹${order.discount.toFixed(2)}`, 360, y);

  // Grand Total
  y += 25;
  doc.rect(350, y - 5, 190, 25).fill(COLORS.secondary).fillColor('#fff').font('Bold').fontSize(14);
  doc.text(`Grand Total: ₹${order.total.toFixed(2)}`, 360, y);

  addFooter(doc);
}

// ------------------------- Exports -------------------------

export async function generateInvoicePDF(orderId, res) {
  try {
    const order = await getOrderDetails(orderId);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Register fonts
    if (fs.existsSync(FONT_PATHS.regular) && fs.existsSync(FONT_PATHS.bold)) {
      doc.registerFont('Regular', FONT_PATHS.regular);
      doc.registerFont('Bold', FONT_PATHS.bold);
    } else {
      throw new Error('Missing font files. Please place NotoSans-Regular.ttf and NotoSans-Bold.ttf in /assets/fonts/');
    }

    // Pipe PDF output directly to HTTP response
    doc.pipe(res);

    renderInvoice(doc, order, 'INVOICE');
    doc.end();

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function generateOrderConfirmationPDF(orderId) {
  try {
    const order = await getOrderDetails(orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const invoicesDir = path.join(process.cwd(), 'invoices');
    if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `order_confirmation_${order.order_number}_${timestamp}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Register fonts
    if (fs.existsSync(FONT_PATHS.regular) && fs.existsSync(FONT_PATHS.bold)) {
      doc.registerFont('Regular', FONT_PATHS.regular);
      doc.registerFont('Bold', FONT_PATHS.bold);
    } else {
      throw new Error('Missing font files. Please place NotoSans-Regular.ttf and NotoSans-Bold.ttf in /assets/fonts/');
    }

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    renderInvoice(doc, order, 'ORDER CONFIRMATION');
    doc.end();

    await new Promise((res, rej) => {
      writeStream.on('finish', res);
      writeStream.on('error', rej);
    });

    const stats = fs.statSync(filePath);
    const invoiceResult = await invoiceModels.createInvoice({
      order_id: orderId,
      invoice_type: 'order_confirmation',
      file_name: fileName,
      file_path: filePath,
      file_size: stats.size.toString()
    });

    return { success: true, fileName, filePath, fileSize: stats.size.toString(), invoiceId: invoiceResult.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getInvoicesByOrder(orderId) {
  try {
    return await invoiceModels.getInvoicesByOrderId(orderId);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAllInvoices() {
  try {
    return await invoiceModels.getAllInvoices();
  } catch (error) {
    return { success: false, error: error.message };
  }
}