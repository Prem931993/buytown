import * as invoiceModels from '../models/invoice.models.js';
import db from '../../../config/db.js';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // First, get order items and basic order info
    const orderRows = await db('byt_orders')
      .leftJoin('byt_users', 'byt_orders.user_id', 'byt_users.id')
      .leftJoin('byt_order_items', 'byt_orders.id', 'byt_order_items.order_id')
      .leftJoin('byt_products', 'byt_order_items.product_id', 'byt_products.id')
      .leftJoin('byt_product_variations', 'byt_order_items.variation_id', 'byt_product_variations.id')
      .leftJoin('byt_variations', 'byt_product_variations.variation_id', 'byt_variations.id')
      .leftJoin('byt_users as delivery_user', 'byt_orders.delivery_person_id', 'delivery_user.id')
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
        'byt_products.hsn_code as product_hsn',
        'byt_products.gst as product_gst',
        'byt_variations.label as variation_name',
        'delivery_user.vehicle_number as delivery_vehicle_number',
        'byt_orders.delivery_distance'  // Added delivery_distance here
      );

    if (!orderRows.length) return null;

    // Get vehicle information separately to avoid duplication
    const vehicleInfo = await db('byt_orders')
      .leftJoin('byt_users as delivery_user', 'byt_orders.delivery_person_id', 'delivery_user.id')
      .leftJoin('byt_user_vehicle', 'delivery_user.id', 'byt_user_vehicle.user_id')
      .leftJoin('byt_vehicle_management', 'byt_user_vehicle.vehicle_id', 'byt_vehicle_management.id')
      .where('byt_orders.id', orderId)
      .whereNotNull('byt_orders.delivery_person_id')
      .select(
        'byt_vehicle_management.vehicle_type as delivery_vehicle_type'
      )
      .first();

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
      deliveryDistance: parseFloat(firstRow.delivery_distance) || 0,  // Added deliveryDistance here
      deliveryVehicleNumber: firstRow.delivery_vehicle_number || 'N/A',
      deliveryVehicleType: vehicleInfo?.delivery_vehicle_type || 'N/A',
      shippingAddress,
      billingAddress,
      items: []
    };

    // Use a Set to track unique items and avoid duplicates
    const uniqueItems = new Map();

    orderRows.forEach(row => {
      if (row.item_id && !uniqueItems.has(row.item_id)) {
        const gstRate = parseFloat(row.product_gst) || 0;
        const basePrice = parseFloat(row.item_price) || 0;
        const quantity = row.quantity || 0;
        const taxAmount = basePrice * gstRate / 100 * quantity;
        const totalWithoutTax = basePrice * quantity;

        uniqueItems.set(row.item_id, {
          id: row.item_id,
          name: row.product_name || 'Unknown Product',
          sku: row.product_sku || 'N/A',
          hsn_code: row.product_hsn || 'N/A',
          price: basePrice,
          quantity: quantity,
          tax_rate: gstRate,
          tax_amount: taxAmount,
          total_without_tax: totalWithoutTax,
          total: parseFloat(row.item_total) || 0
        });
      }
    });

    orderDetails.items = Array.from(uniqueItems.values());

    return orderDetails;
  } catch (error) {
    throw error;
  }
}

// ------------------------- HTML Template Renderer -------------------------

function renderInvoiceHTML(order, title = 'TAX INVOICE') {
  const templatePath = path.join(process.cwd(), 'templates/invoice.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Prepare data for template
  const deliveryCharges = parseFloat(order.deliveryCharges) || 0;
  const deliveryBase = deliveryCharges / 1.18;
  const deliveryTax = deliveryCharges - deliveryBase;
  const deliveryCgst = deliveryTax / 2;
  const deliverySgst = deliveryTax / 2;
  const data = {
    order_number: order.order_number,
    customer_name: order.customer.name,
    billing_address: order.billingAddress ? `${order.billingAddress.street || ''}\n${order.billingAddress.city || ''} ${order.billingAddress.state || ''} ${order.billingAddress.zip_code || ''}\n${order.billingAddress.country || ''}` : '',
    shipping_address: order.shippingAddress ? `${order.shippingAddress.street || ''}\n${order.shippingAddress.city || ''} ${order.shippingAddress.state || ''} ${order.shippingAddress.zip_code || ''}\n${order.shippingAddress.country || ''}` : '',
    date_of_bill: new Date(order.orderDate).toLocaleDateString('en-GB'),
    place_of_supply: order.shippingAddress ? `${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''}, ${order.shippingAddress.zip_code || ''}` : '',
    items: order.items.map(item => ({
      ...item,
      unit: 'Nos', // Assuming default unit
      price: item.price.toFixed(2),
      total_without_tax: item.total_without_tax.toFixed(2),
      gst_rate: item.tax_rate,
      cgst: (item.tax_amount / 2).toFixed(2),
      sgst: (item.tax_amount / 2).toFixed(2),
      tax_amount: item.tax_amount.toFixed(2)
    })),
    subtotal: order.subtotal.toFixed(2),
    cgst: (order.tax / 2).toFixed(2),
    sgst: (order.tax / 2).toFixed(2),
    delivery_charges: deliveryCharges.toFixed(2),
    delivery_distance: order.deliveryDistance.toFixed(2),
    delivery_vehicle_type: order.deliveryVehicleType,
    delivery_vehicle_number: order.deliveryVehicleNumber,
    delivery_base: deliveryBase.toFixed(2),
    delivery_cgst: deliveryCgst.toFixed(2),
    delivery_sgst: deliverySgst.toFixed(2),
    total: order.total.toFixed(2)
  };

  // Replace placeholders with data
  html = html.replace(/{{order_number}}/g, data.order_number);
  html = html.replace(/{{customer_name}}/g, data.customer_name);
  html = html.replace(/{{billing_address}}/g, data.billing_address);
  html = html.replace(/{{shipping_address}}/g, data.shipping_address);
  html = html.replace(/{{place_of_supply}}/g, data.place_of_supply);
  html = html.replace(/{{date_of_bill}}/g, data.date_of_bill);
  html = html.replace(/{{subtotal}}/g, data.subtotal);
  html = html.replace(/{{cgst}}/g, data.cgst);
  html = html.replace(/{{sgst}}/g, data.sgst);
  html = html.replace(/{{delivery_charges}}/g, data.delivery_charges);
  html = html.replace(/{{delivery_distance}}/g, data.delivery_distance);
  html = html.replace(/{{delivery_vehicle_type}}/g, data.delivery_vehicle_type);
  html = html.replace(/{{delivery_vehicle_number}}/g, data.delivery_vehicle_number);
  html = html.replace(/{{delivery_base}}/g, data.delivery_base);
  html = html.replace(/{{delivery_cgst}}/g, data.delivery_cgst);
  html = html.replace(/{{delivery_sgst}}/g, data.delivery_sgst);
  html = html.replace(/{{total}}/g, data.total);
  html = html.replace(/{{place_supply}}/g, data.total);

  // Handle items loop (simple replacement for now)
  let itemsHtml = '';
  data.items.forEach((item) => {
    itemsHtml += `
      <tr>
        <td>${item.name}</td>
        <td>${item.sku}</td>
        <td>${item.hsn_code}</td>
        <td>₹ ${item.price}</td>
        <td>${item.quantity}</td>
        <td>${item.gst_rate}%</td>
        <td>₹ ${item.cgst}</td>
        <td>₹ ${item.sgst}</td>
        <td>₹ ${item.tax_amount}</td>
        <td>₹ ${item.total_without_tax}</td>
      </tr>
    `;
  });
  html = html.replace(/{{#each items}}[\s\S]*?{{\/each}}/g, itemsHtml);

  return html;
}


// ------------------------- Exports -------------------------

export async function generateInvoicePDF(orderId, res) {
  try {
    const order = await getOrderDetails(orderId);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();

    const htmlContent = renderInvoiceHTML(order, 'TAX INVOICE');

    await page.setContent(htmlContent, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.order_number}.pdf`);
    res.send(pdfBuffer);

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

    const browser = await chromium.launch();
    const page = await browser.newPage();

    const htmlContent = renderInvoiceHTML(order, 'ORDER CONFIRMATION');

    await page.setContent(htmlContent, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    fs.writeFileSync(filePath, pdfBuffer);

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