const nodemailer = require('nodemailer');

// Configure email transporter
// For production, use a service like SendGrid, Mailgun, or AWS SES
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendSubmissionNotification(toEmail, formName, submissionData) {
  // Format submission data as HTML
  const dataHtml = Object.entries(submissionData)
    .map(([key, value]) => `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>${key}</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${value}</td></tr>`)
    .join('');

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: `New submission for ${formName}`,
    html: `
      <h2>New Form Submission</h2>
      <p>You received a new submission for <strong>${formName}</strong></p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
        <thead>
          <tr>
            <th style="padding: 8px; border: 1px solid #ddd; background: #f4f4f4;">Field</th>
            <th style="padding: 8px; border: 1px solid #ddd; background: #f4f4f4;">Value</th>
          </tr>
        </thead>
        <tbody>
          ${dataHtml}
        </tbody>
      </table>
      <p style="margin-top: 20px; color: #666;">Sent by FormBackend</p>
    `
  };

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log('Notification email sent to:', toEmail);
    } else {
      console.log('Email not configured. Would have sent to:', toEmail);
      console.log('Submission data:', submissionData);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - we don't want submission to fail if email fails
  }
}

module.exports = {
  sendSubmissionNotification
};
