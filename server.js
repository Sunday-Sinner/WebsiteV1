const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8000);

app.use(express.json({ limit: '1mb' }));

const emailConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.CONTACT_TO_EMAIL
  );
};

app.get('/api/config', (req, res) => {
  res.json({
    contactEndpoint: '/api/contact',
    checkoutUrl: process.env.CHECKOUT_URL || '',
  });
});

app.post('/api/contact', async (req, res) => {
  const payload = req.body || {};
  const formType = String(payload.formType || 'contact');
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const message = String(payload.message || '').trim();

  if (!emailConfigured()) {
    return res.status(503).json({
      message: 'Contact email is not configured. Add SMTP credentials and CONTACT_TO_EMAIL to your .env file before enabling live submissions.',
    });
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const formDetails = [
    `Form type: ${formType}`,
    `Name: ${name || 'Not provided'}`,
    `Email: ${email || 'Not provided'}`,
    '',
    'Form fields:',
    JSON.stringify(payload, null, 2),
    '',
    `Message: ${message || 'No message supplied'}`,
  ].join('\n');

  const subject = `[Sunday Sinner] ${formType.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())} submission`;

  try {
    await transport.sendMail({
      from: process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER,
      to: process.env.CONTACT_TO_EMAIL,
      replyTo: email || undefined,
      subject,
      text: formDetails,
      html: `<pre style="font-family: sans-serif; white-space: pre-wrap;">${formDetails.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
    });

    return res.json({
      success: true,
      message: 'Thanks — your message has been sent.',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'We could not send the message right now. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

app.use(express.static(path.join(__dirname)));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  return res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sunday Sinner site running at http://localhost:${PORT}`);
  console.log('Set SMTP_* and CONTACT_TO_EMAIL in .env to enable email delivery.');
});
