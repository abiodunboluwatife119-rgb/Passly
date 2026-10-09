const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const clientUrl = () =>
  (process.env.CLIENT_URL || 'https://passly-gamma.vercel.app').replace(/\/$/, '');

export const emailConfigured = () =>
  Boolean((process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) && process.env.EMAIL_FROM);

export const sendEmail = async ({ to, subject, html }) => {
  if (!to || !emailConfigured()) return false;

  const fromName = process.env.EMAIL_FROM_NAME || 'Passly';
  const fromAddress = process.env.EMAIL_FROM;

  try {
    let response;

    if (process.env.BREVO_API_KEY) {
      response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromAddress },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
        signal: AbortSignal.timeout(8000),
      });
    } else {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromAddress}>`,
          to: [to],
          subject,
          html,
        }),
        signal: AbortSignal.timeout(8000),
      });
    }

    return response.ok;
  } catch {
    return false;
  }
};

const layout = ({ heading, body, ctaLabel, ctaUrl }) => `
<div style="background:#EDEAD9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#F9F7F1;border:1px solid #DDD8CA;border-radius:10px;overflow:hidden;">
    <div style="height:8px;background:#5C1A1A;"></div>
    <div style="padding:32px 28px;color:#2C2520;line-height:1.6;">
      <p style="margin:0 0 20px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#5C1A1A;">Passly</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${heading}</h1>
      ${body}
      <a href="${ctaUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#2C2520;color:#F9F7F1;text-decoration:none;border-radius:6px;font-weight:700;">${ctaLabel}</a>
    </div>
  </div>
</div>`;

export const approvedEmail = ({ name, businessName }) => {
  const firstName = escapeHtml(String(name || '').split(' ')[0] || 'there');
  return {
    subject: 'Your Passly vendor application was approved',
    html: layout({
      heading: `Welcome aboard, ${firstName}`,
      body: `<p style="margin:0 0 12px;">Your application for <strong>${escapeHtml(businessName)}</strong> has been approved. You can now create listings and start receiving bookings on Passly.</p>
<p style="margin:0;">If you are still logged in, refresh the site to see your Dashboard.</p>`,
      ctaLabel: 'Open your dashboard',
      ctaUrl: `${clientUrl()}/dashboard`,
    }),
  };
};

export const rejectedEmail = ({ name, businessName, note }) => {
  const firstName = escapeHtml(String(name || '').split(' ')[0] || 'there');
  const reason = note
    ? `<p style="margin:0 0 12px;padding:12px 14px;background:#F0ECDF;border-radius:6px;"><strong>Reviewer note:</strong> ${escapeHtml(note)}</p>`
    : '';
  return {
    subject: 'An update on your Passly vendor application',
    html: layout({
      heading: `Hi ${firstName}, we could not approve this one yet`,
      body: `<p style="margin:0 0 12px;">Your application for <strong>${escapeHtml(businessName)}</strong> was not approved this time.</p>
${reason}
<p style="margin:0;">You are welcome to apply again with more detail.</p>`,
      ctaLabel: 'Apply again',
      ctaUrl: `${clientUrl()}/become-vendor`,
    }),
  };
};