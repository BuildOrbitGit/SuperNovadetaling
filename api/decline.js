const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).send('<p>Invalid link.</p>');

  try {
    const booking = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    const firstName = booking.name.split(' ')[0];

    const clientHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#020611;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:520px;margin:0 auto;padding:24px">
<div style="background:#030914;border:1px solid #1a2640;border-radius:16px;overflow:hidden">
<div style="background:linear-gradient(135deg,#030914,#071223);padding:28px;text-align:center;border-bottom:1px solid #1a2640">
<p style="margin:0 0 4px;color:#7a8ba8;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">⭐ Supernova Automobile Detailing</p>
<h1 style="margin:8px 0 0;color:#f0f4ff;font-size:20px">Regarding Your Booking</h1>
</div>
<div style="padding:28px">
<p style="color:#b0bec5;font-size:14px;line-height:1.6;margin-top:0">
Hi ${firstName}, unfortunately we're unable to accommodate your request for <strong style="color:#f0f4ff">${booking.date} at ${booking.time}</strong>.
</p>
<p style="color:#b0bec5;font-size:14px;line-height:1.6">We'd love to find a time that works — please reach out to reschedule:</p>
<div style="text-align:center;margin:24px 0">
<a href="sms:6047283247" style="display:inline-block;padding:14px 36px;background:#08d9ff;border-radius:8px;text-decoration:none;color:#020611;font-weight:700;font-size:15px">📱 Text to Reschedule</a>
</div>
<p style="color:#7a8ba8;font-size:13px;text-align:center">Or call <a href="tel:6047283247" style="color:#08d9ff">604-728-3247</a></p>
</div>
<div style="padding:14px 28px;border-top:1px solid #1a2640;text-align:center">
<p style="margin:0;color:#7a8ba8;font-size:11px">Supernova Automobile Detailing · Kelowna, BC</p>
</div></div></div></body></html>`;

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Supernova Detailing <onboarding@resend.dev>',
      to: booking.email,
      subject: 'Regarding Your Supernova Detailing Request',
      html: clientHtml,
    });

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Declined</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#020611;color:#f0f4ff;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}h2{color:#f0f4ff;margin:16px 0 8px}p{color:#7a8ba8;line-height:1.6}a{color:#08d9ff}</style></head><body><div><div style="font-size:3rem;margin-bottom:8px">📨</div><h2>Decline sent</h2><p>${booking.email} has been notified and given your contact info to reschedule.</p><p style="margin-top:28px"><a href="/">← Back to Supernova Detailing</a></p></div></body></html>`);

  } catch (err) {
    console.error('[/api/decline]', err);
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(`<html><body style="background:#020611;color:#ff6b6b;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div><p>Invalid booking link.</p><a href="/" style="color:#08d9ff">← Home</a></div></body></html>`);
  }
};
