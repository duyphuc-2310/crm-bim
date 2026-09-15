const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Configure multer for temp file uploads
const upload = multer({ dest: 'uploads/' });

// Create Nodemailer transporter
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

router.post('/send', upload.array('attachments'), async (req, res) => {
  try {
    const { recipients, subjectTemplate, bodyTemplate } = req.body;
    let recipientsList = [];
    
    try {
      recipientsList = JSON.parse(recipients);
    } catch (e) {
      return res.status(400).json({ error: 'recipients must be a valid JSON array' });
    }

    if (!recipientsList || recipientsList.length === 0) {
      return res.status(400).json({ error: 'No recipients provided' });
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ error: 'SMTP configuration is missing in .env file' });
    }

    const transporter = getTransporter();

    // Prepare attachments
    const attachments = (req.files || []).map(file => ({
      filename: file.originalname,
      path: file.path
    }));

    let successCount = 0;
    let errors = [];

    // Process each recipient
    for (const recipient of recipientsList) {
      if (!recipient.email) continue;

      let subject = subjectTemplate || '';
      let htmlBody = bodyTemplate || '';

      // Replace variables: {{ten}}, {{ten_cong_ty}}, etc.
      // recipient object should contain these fields.
      const variables = {
        ten: recipient.name || '',
        ten_cong_ty: recipient.company || '',
        sdt: recipient.phone || '',
      };

      for (const [key, val] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, val);
        htmlBody = htmlBody.replace(regex, val);
      }

      // Convert newlines to <br> if it's plain text (simple check)
      if (!htmlBody.includes('<html') && !htmlBody.includes('<br')) {
         htmlBody = htmlBody.replace(/\n/g, '<br/>');
      }

      try {
        await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'CRM System'}" <${process.env.SMTP_USER}>`,
          to: recipient.email,
          subject: subject,
          html: htmlBody,
          attachments: attachments
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to send email to ${recipient.email}:`, err);
        errors.push({ email: recipient.email, error: err.message });
      }
    }

    // Clean up temp files
    if (req.files) {
      for (const file of req.files) {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Failed to delete temp file:', err);
        });
      }
    }

    res.json({
      success: true,
      sent: successCount,
      failed: errors.length,
      errors
    });
  } catch (error) {
    console.error('Mail merge error:', error);
    // Cleanup on error
    if (req.files) {
      req.files.forEach(f => fs.unlink(f.path, () => {}));
    }
    res.status(500).json({ error: 'Internal server error during mail merge' });
  }
});

module.exports = router;
