const { Resend } = require('resend');
const { put } = require('@vercel/blob');

const resend = new Resend(process.env.RESEND_API_KEY);

function encodeToken(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

async function uploadPhoto(base64String, index) {
  const match = base64String.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const [, mime, b64] = match;
  const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const buffer = Buffer.from(b64, 'base64');
  const { url } = await put(`bookings/${Date.now()}-photo-${index + 1}.${ext}`, buffer, {
    access: 'public',
    contentType: mime,
  });
  return url;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const {
      name, email, phone, address,
      date, time,
      make, model, year, color, vehicleType,
      service, addons = [], notes,
      photos = [],
    } = req.body;

    if (!name || !email || !phone || !address || !date || !time || !make || !model || !year || !service) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    // Upload photos to Vercel Blob (best-effort — no photos is fine)
    let photoUrls = [];
    if (photos.length && process.env.BLOB_READ_WRITE_TOKEN) {
      photoUrls = (await Promise.allSettled(photos.map(uploadPhoto)))
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);
    }

    const bookingData = {
      name, email, phone, address, date, time,
      make, model, year, color, vehicleType,
      service, addons, notes, photoUrls,
      createdAt: new Date().toISOString(),
    };

    const token = encodeToken(bookingData);
    const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    const confirmUrl = `${base}/api/confirm?token=${token}`;
    const declineUrl = `${base}/api/decline?token=${token}`;
    const addonsText = addons.length ? addons.join(', ') : 'None';

    const photoBlock = photoUrls.length
      ? `<div style="margin:20px 0"><p style="margin:0 0 10px;color:#7a8ba8;font-size:12px;text-transform:uppercase;letter-spacing:0.1em">Customer Photos</p><div style="display:flex;flex-wrap:wrap;gap:8px">${photoUrls.map(u => `<img src="${u}" width="130" height="100" style="object-fit:cover;border-radius:8px;border:1px solid #1a2640">`).join('')}</div></div>`
      : '';

    const ownerHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#020611;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:620px;margin:0 auto;padding:24px">
<div style="background:#030914;border:1px solid #1a2640;border-radius:16px;overflow:hidden">

<div style="background:linear-gradient(135deg,#030914,#071223);padding:28px;text-align:center;border-bottom:1px solid rgba(8,217,255,0.2)">
<p style="margin:0 0 4px;color:#08d9ff;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">⭐ Supernova Automobile Detailing</p>
<h1 style="margin:0;color:#f0f4ff;font-size:22px">New Booking Request 🚗</h1>
</div>

<div style="padding:28px">
<p style="color:#b0bec5;font-size:14px;line-height:1.6;margin-top:0">Someone just requested a detailing appointment. Review and respond below.</p>

<table style="width:100%;border-collapse:collapse;background:#070e1d;border-radius:10px;overflow:hidden;margin-bottom:4px">
<tr><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;width:38%">Customer</td><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#f0f4ff;font-size:14px;font-weight:600">${name}</td></tr>
<tr><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Phone</td><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#f0f4ff;font-size:14px;font-weight:600">${phone}</td></tr>
<tr><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Email</td><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#f0f4ff;font-size:14px">${email}</td></tr>
<tr><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Date &amp; Time</td><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#08d9ff;font-size:14px;font-weight:600">${date} · ${time}</td></tr>
<tr><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Location</td><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#f0f4ff;font-size:14px">${address}</td></tr>
<tr><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Vehicle</td><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#f0f4ff;font-size:14px;font-weight:600">${year} ${make} ${model}${color ? ' · ' + color : ''} · ${vehicleType}</td></tr>
<tr><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Package</td><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#f0f4ff;font-size:14px;font-weight:600">${service}</td></tr>
<tr><td style="padding:10px 14px;${notes ? 'border-bottom:1px solid #1a2640;' : ''}color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Add-Ons</td><td style="padding:10px 14px;${notes ? 'border-bottom:1px solid #1a2640;' : ''}color:#f0f4ff;font-size:14px">${addonsText}</td></tr>
${notes ? `<tr><td style="padding:10px 14px;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Notes</td><td style="padding:10px 14px;color:#b0bec5;font-size:14px">${notes}</td></tr>` : ''}
</table>

${photoBlock}

<table style="width:100%;border-collapse:collapse;margin-top:24px"><tr>
<td style="padding-right:6px"><a href="${confirmUrl}" style="display:block;padding:16px;background:#08d9ff;border-radius:8px;text-align:center;text-decoration:none;color:#020611;font-weight:700;font-size:15px">✓ Confirm Booking</a></td>
<td style="padding-left:6px"><a href="${declineUrl}" style="display:block;padding:16px;background:transparent;border:1px solid rgba(255,80,80,0.4);border-radius:8px;text-align:center;text-decoration:none;color:#ff6b6b;font-weight:600;font-size:15px">✗ Decline</a></td>
</tr></table>

<p style="color:#7a8ba8;font-size:12px;margin-top:16px;text-align:center">Clicking Confirm will add this to your Google Calendar and send the customer a confirmation email.</p>
</div>

<div style="padding:14px 28px;border-top:1px solid #1a2640;text-align:center">
<p style="margin:0;color:#7a8ba8;font-size:11px">Supernova Automobile Detailing · Kelowna, BC · 604-728-3247</p>
</div>
</div></div></body></html>`;

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Supernova Detailing <onboarding@resend.dev>',
      to: process.env.OWNER_EMAIL,
      subject: `New Booking — ${name} · ${date} at ${time}`,
      html: ownerHtml,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[/api/book]', err);
    return res.status(500).json({ error: 'Something went wrong. Please text us directly at 604-728-3247.' });
  }
};
