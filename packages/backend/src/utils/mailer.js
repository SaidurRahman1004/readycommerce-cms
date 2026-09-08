const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  return transporter;
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const orderConfirmationHtml = ({ order, items }) => {
  const rows = items.map((item) => `<tr>
    <td style="padding:14px 0;border-bottom:1px solid #e7e4df;color:#292524;">${escapeHtml(item.productName)}<br><span style="font-size:12px;color:#78716c;">Qty ${escapeHtml(item.quantity)}</span></td>
    <td style="padding:14px 0;border-bottom:1px solid #e7e4df;text-align:right;color:#292524;">${escapeHtml(order.currency || 'BDT')} ${Number(item.total || 0).toLocaleString()}</td>
  </tr>`).join('');
  return `<!doctype html><html><body style="margin:0;background:#f5f3ef;font-family:Arial,sans-serif;color:#292524;">
  <div style="max-width:620px;margin:32px auto;padding:0 16px;"><div style="background:#ffffff;border:1px solid #e7e4df;border-radius:24px;overflow:hidden;">
    <div style="padding:32px;background:#211d1a;color:#ffffff;"><div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#d6b98c;">ReadyCommerce</div><h1 style="margin:18px 0 8px;font-size:28px;font-weight:600;">Thank you for your order.</h1><p style="margin:0;color:#e7e5e4;">Your considered edit is being prepared with care.</p></div>
    <div style="padding:32px;"><p style="margin:0 0 6px;color:#78716c;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Order number</p><p style="margin:0 0 28px;font-size:20px;font-weight:700;">${escapeHtml(order.orderNumber)}</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;"><tbody>${rows}</tbody></table>
      <table role="presentation" style="width:100%;margin-top:20px;border-collapse:collapse;"><tr><td style="padding:6px 0;color:#78716c;">Subtotal</td><td style="padding:6px 0;text-align:right;">${escapeHtml(order.currency || 'BDT')} ${Number(order.subtotal || 0).toLocaleString()}</td></tr><tr><td style="padding:6px 0;color:#78716c;">Shipping</td><td style="padding:6px 0;text-align:right;">${escapeHtml(order.currency || 'BDT')} ${Number(order.shipping || 0).toLocaleString()}</td></tr><tr><td style="padding:16px 0 0;border-top:1px solid #e7e4df;font-weight:700;">Total</td><td style="padding:16px 0 0;border-top:1px solid #e7e4df;text-align:right;font-weight:700;color:#8b5e34;">${escapeHtml(order.currency || 'BDT')} ${Number(order.total || 0).toLocaleString()}</td></tr></table>
      <p style="margin:30px 0 0;padding:16px;border-radius:12px;background:#faf8f4;color:#57534e;font-size:13px;line-height:1.6;">We will verify your payment and keep you updated as your order moves through each stage.</p>
    </div><div style="padding:20px 32px;background:#faf8f4;color:#78716c;font-size:12px;">Need help? Reply to this email or contact our care team.</div>
  </div></div></body></html>`;
};

const sendOrderConfirmation = async ({ to, order, items }) => {
  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    console.warn('[mailer] SMTP is not configured; order confirmation email skipped.');
    return { skipped: true };
  }
  return mailTransporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Order confirmed — ${order.orderNumber}`,
    html: orderConfirmationHtml({ order, items }),
  });
};

module.exports = { sendOrderConfirmation };
