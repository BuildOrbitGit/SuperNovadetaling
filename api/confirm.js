const { Resend } = require('resend');
const { google } = require('googleapis');

const resend = new Resend(process.env.RESEND_API_KEY);

function buildICS({ date, time, name, address, service, make, model, year }) {
  const months = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };
  let dt;
  try {
    // Accepts "June 25, 2025" or ISO "2025-06-25"
    if (date.includes('-')) {
      const [y, m, d] = date.split('-').map(Number);
      dt = { y, m, d };
    } else {
      const parts = date.replace(',', '').split(' ');
      const mon = parts[0].slice(0, 3);
      dt = { y: Number(parts[2]), m: months[mon] || 1, d: Number(parts[1]) };
    }
  } catch { dt = { y: 2025, m: 6, d: 1 }; }

  const timeStr = String(time).toUpperCase();
  const timeParts = timeStr.replace(/\s*(AM|PM)/, '').split(':');
  let h = Number(timeParts[0]);
  const min = Number(timeParts[1] || 0);
  if (timeStr.includes('PM') && h !== 12) h += 12;
  if (timeStr.includes('AM') && h === 12) h = 0;

  const pad = n => String(n).padStart(2, '0');
  const base = `${dt.y}${pad(dt.m)}${pad(dt.d)}`;
  const dtStart = `${base}T${pad(h)}${pad(min)}00`;
  const dtEnd   = `${base}T${pad(Math.min(h + 3, 23))}${pad(min)}00`;

  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Supernova Detailing//EN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Supernova Detail — ${name}`,
    `DESCRIPTION:Package: ${service}\\nVehicle: ${year} ${make} ${model}\\nLocation: ${address}`,
    `LOCATION:${address}`,
    'STATUS:CONFIRMED',
    `UID:${Date.now()}@supernovadetailing.ca`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

async function addToGoogleCalendar(booking) {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return;

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });
  const { date, time, name, address, service, addons, phone, email, make, model, year } = booking;

  const months = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };
  let dt;
  if (date.includes('-')) {
    const [y, m, d] = date.split('-').map(Number);
    dt = { y, m, d };
  } else {
    const parts = date.replace(',', '').split(' ');
    dt = { y: Number(parts[2]), m: months[parts[0].slice(0,3)] || 1, d: Number(parts[1]) };
  }

  const timeStr = String(time).toUpperCase();
  const timeParts = timeStr.replace(/\s*(AM|PM)/, '').split(':');
  let h = Number(timeParts[0]);
  const min = Number(timeParts[1] || 0);
  if (timeStr.includes('PM') && h !== 12) h += 12;
  if (timeStr.includes('AM') && h === 12) h = 0;

  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${dt.y}-${pad(dt.m)}-${pad(dt.d)}`;

  await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    resource: {
      summary: `⭐ Detail — ${name} (${make} ${model})`,
      description: `Package: ${service}\nAdd-Ons: ${addons?.join(', ') || 'None'}\nPhone: ${phone}\nEmail: ${email}`,
      location: address,
      start: { dateTime: `${dateStr}T${pad(h)}:${pad(min)}:00`, timeZone: 'America/Vancouver' },
      end:   { dateTime: `${dateStr}T${pad(Math.min(h+3,23))}:${pad(min)}:00`, timeZone: 'America/Vancouver' },
      colorId: '6',
    },
  });
}

module.exports = async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).send('<p>Invalid link.</p>');

  try {
    const booking = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));

    try { await addToGoogleCalendar(booking); }
    catch (e) { console.warn('[confirm] Google Calendar skipped:', e.message); }

    const icsContent = buildICS(booking);

    const clientHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#020611;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#030914;border:1px solid rgba(8,217,255,0.2);border-radius:16px;overflow:hidden">
<div style="background:linear-gradient(135deg,#030914,#071223);padding:32px;text-align:center;border-bottom:1px solid rgba(8,217,255,0.2)">
<div style="width:60px;height:60px;border-radius:50%;background:rgba(8,217,255,0.1);border:2px solid #08d9ff;margin:0 auto 16px;font-size:26px;line-height:60px;text-align:center">✓</div>
<p style="margin:0 0 4px;color:#08d9ff;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">Booking Confirmed</p>
<h1 style="margin:0;color:#f0f4ff;font-size:22px">You're all set, ${booking.name.split(' ')[0]}!</h1>
</div>
<div style="padding:28px">
<p style="color:#b0bec5;font-size:14px;line-height:1.6;margin-top:0">Your detailing appointment is confirmed. We'll arrive at your location ready to go.</p>
<table style="width:100%;border-collapse:collapse;background:#070e1d;border-radius:10px;overflow:hidden;margin-bottom:20px">
<tr><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;width:38%">Date &amp; Time</td><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#08d9ff;font-size:14px;font-weight:600">${booking.date} · ${booking.time}</td></tr>
<tr><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Location</td><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#f0f4ff;font-size:14px">${booking.address}</td></tr>
<tr><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Vehicle</td><td style="padding:10px 14px;border-bottom:1px solid #1a2640;color:#f0f4ff;font-size:14px;font-weight:600">${booking.year} ${booking.make} ${booking.model}</td></tr>
<tr><td style="padding:10px 14px;color:#7a8ba8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Package</td><td style="padding:10px 14px;color:#f0f4ff;font-size:14px;font-weight:600">${booking.service}</td></tr>
</table>
<p style="color:#b0bec5;font-size:13px;line-height:1.7">📅 A calendar invite is attached — tap it to add to your calendar.<br>📱 Questions? Text or call <a href="tel:6047283247" style="color:#08d9ff">604-728-3247</a></p>
</div>
<div style="padding:14px 28px;border-top:1px solid #1a2640;text-align:center">
<p style="margin:0;color:#7a8ba8;font-size:11px">Supernova Automobile Detailing · Kelowna, BC</p>
</div></div></div></body></html>`;

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Supernova Detailing <onboarding@resend.dev>',
      to: booking.email,
      subject: `Your Supernova Detail is Confirmed — ${booking.date} at ${booking.time}`,
      html: clientHtml,
      attachments: [{
        filename: 'supernova-booking.ics',
        content: Buffer.from(icsContent).toString('base64'),
      }],
    });

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Confirmed</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#020611;color:#f0f4ff;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}h2{color:#08d9ff;margin:16px 0 8px}p{color:#7a8ba8;line-height:1.6}a{color:#08d9ff}</style></head><body><div><div style="font-size:3rem;margin-bottom:8px">⭐</div><h2>Booking Confirmed!</h2><p>Confirmation email sent to ${booking.email}.<br>Added to your Google Calendar.</p><p style="margin-top:28px"><a href="/">← Back to Supernova Detailing</a></p></div></body></html>`);

  } catch (err) {
    console.error('[/api/confirm]', err);
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(`<html><body style="background:#020611;color:#ff6b6b;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div><p>Invalid or expired booking link.</p><a href="/" style="color:#08d9ff">← Home</a></div></body></html>`);
  }
};
