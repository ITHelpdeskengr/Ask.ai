const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Apply authMiddleware to all routes
router.use(authMiddleware);
const nodemailer = require('nodemailer');

const getTransporter = () => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your.email')) return null;
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
};

// POST /api/email/send
router.post('/send', async (req, res) => {
  const { to, subject, body, cc } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject, body are required' });
  }

  const transporter = getTransporter();
  if (!transporter) {
    return res.json({
      success: true,
      demo: true,
      message: `[DEMO] Email would be sent to ${to} with subject "${subject}". Configure EMAIL_USER and EMAIL_PASS in .env to enable real sending.`,
    });
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'ASK.ai Assistant'}" <${process.env.EMAIL_FROM}>`,
      to, cc, subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">${body.replace(/\n/g, '<br>')}</div>`,
      text: body,
    });
    res.json({ success: true, messageId: info.messageId, message: `Email sent to ${to} successfully!` });
  } catch (err) {
    console.error('[EMAIL]', err.message);
    res.status(500).json({ error: 'Failed to send email: ' + err.message });
  }
});

// POST /api/email/compose (returns a draft, doesn't send)
router.post('/compose', (req, res) => {
  const { to, subject, context } = req.body;
  res.json({
    draft: {
      to: to || '',
      subject: subject || '',
      body: `Dear ${to || 'Recipient'},\n\n[Your message here based on context: ${context || 'N/A'}]\n\nBest regards,\n${process.env.BOT_NAME || 'ASK.ai'}`,
    },
    message: 'Email draft created. Review and send when ready.',
  });
});

module.exports = router;
