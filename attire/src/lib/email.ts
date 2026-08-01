/**
 * Transactional email helper.
 *
 * Uses the Resend HTTP API (no SDK dependency — just fetch). If RESEND_API_KEY
 * is not configured the helper no-ops and returns false, so email is a
 * best-effort side-effect that can never break the primary flow (e.g. an order
 * still succeeds even if the confirmation email can't be sent).
 *
 * Configure in .env:
 *   RESEND_API_KEY=...
 *   EMAIL_FROM="Regal <noreply@yourdomain.com>"
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Regal <onboarding@resend.dev>';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', to);
    return false;
  }
  if (!to) {
    console.warn('[email] No recipient address — skipping');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    });

    if (!res.ok) {
      console.error('[email] Send failed:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] Send threw:', err);
    return false;
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface OrderConfirmationItem {
  name: string;
  quantity: number;
  price: number;
  isPreorder?: boolean;
}

export interface OrderConfirmationData {
  orderId: string;
  customerName?: string;
  items: OrderConfirmationItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
}

/**
 * Build the order-confirmation email (subject + HTML). Amounts are ETB.
 */
export function renderOrderConfirmation(data: OrderConfirmationData): { subject: string; html: string } {
  const money = (n: number) => `ETB ${Number(n || 0).toFixed(2)}`;
  const shortId = data.orderId.slice(0, 8).toUpperCase();

  const rows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">
            ${escapeHtml(item.name)}${item.isPreorder ? ' <span style="color:#b45309;font-size:12px;">(Pre-order)</span>' : ''}
            <br/><span style="color:#888;font-size:12px;">Qty: ${escapeHtml(item.quantity)}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${money(item.price * item.quantity)}</td>
        </tr>`
    )
    .join('');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;">
    <h2 style="color:#111827;">Thank you${data.customerName ? `, ${escapeHtml(data.customerName)}` : ''}!</h2>
    <p>Your order <strong>#${shortId}</strong> has been received. We'll be in touch shortly to confirm the details.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tbody>
        ${rows}
      </tbody>
    </table>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:4px 0;">Subtotal</td><td style="padding:4px 0;text-align:right;">${money(data.subtotal)}</td></tr>
      ${data.discount ? `<tr><td style="padding:4px 0;color:#059669;">Discount</td><td style="padding:4px 0;text-align:right;color:#059669;">-${money(data.discount)}</td></tr>` : ''}
      <tr><td style="padding:4px 0;">Shipping</td><td style="padding:4px 0;text-align:right;">${data.shipping === 0 ? 'FREE' : money(data.shipping)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;border-top:1px solid #eee;">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold;border-top:1px solid #eee;">${money(data.total)}</td></tr>
    </table>
    <p style="color:#6b7280;font-size:13px;">Payment method: Cash on Delivery</p>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Regal — All your needs at one place.</p>
  </div>`;

  return { subject: `Order Confirmation #${shortId}`, html };
}
