/**
 * controllers/contactController.js
 *
 * Handles:
 *  1. sendContactEmail — main contact form submissions
 *  2. sendLeadEmail    — chatbot lead capture submissions
 *
 * Uses Nodemailer with SMTP credentials from .env
 */

'use strict';

const Contact = require('../models/Contact');
const Lead    = require('../models/Lead');

// ADD this instead:
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// -----------------------------------------------------------------------
// Sanitize a plain-text string
// -----------------------------------------------------------------------
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[&<>"']/g, c => ({
      '&' : '&amp;',
      '<' : '&lt;',
      '>' : '&gt;',
      '"' : '&quot;',
      "'" : '&#39;'
    }[c]))
    .trim();
}

// -----------------------------------------------------------------------
// Get current time in IST
// -----------------------------------------------------------------------
function getISTTime() {
  return new Date().toLocaleString('en-IN', {
    timeZone : 'Asia/Kolkata',
    day      : '2-digit',
    month    : 'short',
    year     : 'numeric',
    hour     : '2-digit',
    minute   : '2-digit',
    hour12   : true
  });
}

// -----------------------------------------------------------------------
// Shared email header HTML
// Dark background so all text and links are clearly visible
// -----------------------------------------------------------------------
function emailHeader(title, subtitle) {
  return `
    <div style="
      background: linear-gradient(135deg, #0d1a15, #1a2e26);
      padding: 28px 32px;
      border-radius: 12px 12px 0 0;
      border-bottom: 3px solid #2F7A66;
    ">
      <h2 style="
        color: #ffffff;
        margin: 0;
        font-size: 1.3rem;
        font-family: Arial, sans-serif;
        font-weight: 700;
        letter-spacing: -0.3px;
      ">${title}</h2>
      <p style="
        color: rgba(255,255,255,0.6);
        margin: 6px 0 0;
        font-size: 0.85rem;
        font-family: Arial, sans-serif;
      ">${subtitle}</p>
    </div>
  `;
}

// -----------------------------------------------------------------------
// Shared email footer HTML
// -----------------------------------------------------------------------
function emailFooter() {
  return `
    <div style="
      background: #f0f4f2;
      border-top: 1px solid #e5ede9;
      padding: 16px 32px;
      border-radius: 0 0 12px 12px;
      text-align: center;
    ">
      <p style="
        margin: 0;
        font-size: 0.78rem;
        color: #8fa99f;
        font-family: Arial, sans-serif;
      ">
        © ${new Date().getFullYear()} Dilshad Designs | New Delhi, India
        &nbsp;·&nbsp;
        <a href="https://dilshadesigns.vercel.app"
           style="color: #2F7A66; text-decoration: none;">
          dilshadesigns.vercel.app
        </a>
      </p>
    </div>
  `;
}

// -----------------------------------------------------------------------
// Shared button style
// -----------------------------------------------------------------------
function emailButton(href, label) {
  return `
    <div style="margin-top: 24px; text-align: center;">
      <a href="${href}"
         style="
           background: #2F7A66;
           color: #ffffff;
           padding: 12px 28px;
           border-radius: 99px;
           text-decoration: none;
           font-weight: 600;
           font-size: 0.95rem;
           font-family: Arial, sans-serif;
           display: inline-block;
         ">
        ${label}
      </a>
    </div>
  `;
}

// -----------------------------------------------------------------------
// 1. sendContactEmail — POST /api/contact
// -----------------------------------------------------------------------
exports.sendContactEmail = async (req, res, next) => {
  try {
    const name    = sanitize(req.body.name);
    const email   = sanitize(req.body.email);
    const subject = sanitize(req.body.subject);
    const message = sanitize(req.body.message);

    // Honeypot anti-spam check
    if (req.body._honey) {
      return res.status(200).json({
        success : true,
        message : 'Message received.'
      });
    }

    const transporter = createTransporter();

    // ── Email to site owner ─────────────────────────────────────────────
    const ownerMailOptions = {
      from    : `"Dilshad Designs Website" <${process.env.SMTP_USER}>`,
      to      : process.env.OWNER_EMAIL,
      replyTo : email,
      subject : `[New Enquiry] ${subject} — from ${name}`,
      text    : `
You have a new contact form submission from dilshadesigns.vercel.app

Name:          ${name}
Email:         ${email}
Project Type:  ${subject}
Time:          ${getISTTime()} IST
Message:
${message}

---
Sent via the Dilshad Designs contact form.
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<body style="
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f4f7f6;
">

  <div style="max-width: 560px; margin: 0 auto;">

    ${emailHeader('📩 New Contact Form Submission', 'dilshadesigns.vercel.app')}

    <div style="
      background: #ffffff;
      border: 1px solid #e5ede9;
      border-top: none;
      padding: 28px 32px;
    ">

      <table style="width:100%; border-collapse:collapse;">
        <tr style="border-bottom: 1px solid #f0f4f2;">
          <td style="padding:10px 0; font-weight:600; color:#5a7a6e; width:130px; font-size:0.88rem;">Name</td>
          <td style="padding:10px 0; color:#1a2e26; font-size:0.95rem;">${name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f0f4f2;">
          <td style="padding:10px 0; font-weight:600; color:#5a7a6e; font-size:0.88rem;">Email</td>
          <td style="padding:10px 0;">
            <a href="mailto:${email}"
               style="color:#2F7A66; font-weight:600; font-size:0.95rem; text-decoration:none;">
              ${email}
            </a>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #f0f4f2;">
          <td style="padding:10px 0; font-weight:600; color:#5a7a6e; font-size:0.88rem;">Project Type</td>
          <td style="padding:10px 0; color:#1a2e26; font-size:0.95rem;">${subject}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; font-weight:600; color:#5a7a6e; font-size:0.88rem;">Time</td>
          <td style="padding:10px 0; color:#1a2e26; font-size:0.95rem;">${getISTTime()} IST</td>
        </tr>
      </table>

      <div style="margin-top: 20px;">
        <p style="
          font-weight: 600;
          color: #5a7a6e;
          font-size: 0.88rem;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        ">Message</p>
        <div style="
          background: #f8faf9;
          border: 1px solid #e5ede9;
          border-left: 3px solid #2F7A66;
          border-radius: 8px;
          padding: 16px;
          color: #1a2e26;
          font-size: 0.93rem;
          line-height: 1.7;
          white-space: pre-wrap;
        ">${message}</div>
      </div>

      ${emailButton(
        `mailto:${email}?subject=Re: ${encodeURIComponent(subject)}`,
        `Reply to ${name}`
      )}

    </div>

    ${emailFooter()}

  </div>

</body>
</html>
      `.trim()
    };

    // ── Auto reply to sender ────────────────────────────────────────────
    const autoReplyOptions = {
      from    : `"Dilshad Designs" <${process.env.SMTP_USER}>`,
      to      : email,
      subject : `Thanks for reaching out, ${name}! — Dilshad Designs`,
      text    : `
Hi ${name},

Thank you for getting in touch with Dilshad Designs!

I have received your message about "${subject}" and will get back to you within 2-4 hours.

While you wait check out my work:
Portfolio : https://dilshadesigns.vercel.app
Fiverr    : https://www.fiverr.com/dilshadesigns
Instagram : https://www.instagram.com/dilshadesigns

Best regards,
Dilshad
Dilshad Designs | New Delhi, India
+91 11499 53616
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<body style="
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f4f7f6;
">

  <div style="max-width: 560px; margin: 0 auto;">

    ${emailHeader('Thanks for reaching out! 👋', 'Dilshad Designs')}

    <div style="
      background: #ffffff;
      border: 1px solid #e5ede9;
      border-top: none;
      padding: 28px 32px;
    ">

      <p style="color:#1a2e26; font-size:0.95rem; margin-top:0;">
        Hi <strong>${name}</strong>,
      </p>

      <p style="color:#1a2e26; font-size:0.95rem; line-height:1.7;">
        Thank you for getting in touch with Dilshad Designs! 🎨
      </p>

      <p style="color:#1a2e26; font-size:0.95rem; line-height:1.7;">
        I have received your message about
        <strong style="color:#2F7A66;">${subject}</strong>
        and will get back to you within
        <strong>2–4 hours</strong>.
      </p>

      <div style="
        background: #f8faf9;
        border: 1px solid #e5ede9;
        border-left: 3px solid #2F7A66;
        border-radius: 8px;
        padding: 18px 20px;
        margin: 20px 0;
      ">
        <p style="
          margin: 0 0 12px;
          font-weight: 700;
          color: #1a2e26;
          font-size: 0.9rem;
        ">While you wait check out my work:</p>

        <p style="margin:6px 0; font-size:0.9rem;">
          🌐 <a href="https://dilshadesigns.vercel.app"
                style="color:#2F7A66; font-weight:600; text-decoration:none;">
            dilshadesigns.vercel.app
          </a>
        </p>
        <p style="margin:6px 0; font-size:0.9rem;">
          🛒 <a href="https://www.fiverr.com/dilshadesigns"
                style="color:#2F7A66; font-weight:600; text-decoration:none;">
            fiverr.com/dilshadesigns
          </a>
        </p>
        <p style="margin:6px 0; font-size:0.9rem;">
          📸 <a href="https://www.instagram.com/dilshadesigns"
                style="color:#2F7A66; font-weight:600; text-decoration:none;">
            @dilshadesigns
          </a>
        </p>
      </div>

      <p style="color:#1a2e26; font-size:0.95rem; line-height:1.7; margin-bottom:0;">
        Best regards,<br>
        <strong>Dilshad</strong><br>
        <span style="color:#5a7a6e; font-size:0.88rem;">
          Dilshad Designs | New Delhi, India<br>
          📱 +91 11499 53616
        </span>
      </p>

    </div>

    ${emailFooter()}

  </div>

</body>
</html>
      `.trim()
    };

    // Save to MongoDB
    await Contact.create({
      name,
      email,
      subject,
      message,
      source: 'contact-form'
    });

    await Promise.all([
      resend.emails.send({
        from   : 'Dilshad Designs <onboarding@resend.dev>',
        to     : process.env.OWNER_EMAIL,
        replyTo: email,
        subject: `[New Enquiry] ${subject} — from ${name}`,
        html   : ownerMailOptions.html,
        text   : ownerMailOptions.text,
      }),
      resend.emails.send({
        from   : 'Dilshad Designs <onboarding@resend.dev>',
        to     : email,
        subject: `Thanks for reaching out, ${name}! — Dilshad Designs`,
        html   : autoReplyOptions.html,
        text   : autoReplyOptions.text,
      }),
    ]);

    return res.status(200).json({
      success : true,
      message : "Your message has been sent! I'll get back to you within 2–4 hours.",
    });

  } catch (err) {
    // AFTER — full error details visible in Render logs
    console.error('[contactController] Contact email failed:', err.message);
    console.error('[contactController] Full error:', JSON.stringify({
      code    : err.code,
      command : err.command,
      response: err.response,
      host    : process.env.SMTP_HOST,
      port    : process.env.SMTP_PORT,
      user    : process.env.SMTP_USER ? process.env.SMTP_USER.slice(0,5) + '***' : 'NOT SET',
      pass    : process.env.SMTP_PASS ? 'SET (' + process.env.SMTP_PASS.length + ' chars)' : 'NOT SET',
      owner   : process.env.OWNER_EMAIL ? 'SET' : 'NOT SET',
    }, null, 2));
    return next({
      status  : 500,
      message : 'Failed to send email. Please try again or contact directly at dilshadesign.co@gmail.com.'
    });
  }
};

// -----------------------------------------------------------------------
// 2. sendLeadEmail — POST /api/contact/lead
// -----------------------------------------------------------------------
exports.sendLeadEmail = async (req, res, next) => {
  try {
    const email = sanitize(req.body.email);

    const transporter = createTransporter();

    // ── Email to site owner notifying of new lead ───────────────────────
    const ownerMailOptions = {
      from    : `"Dilshad Designs Website" <${process.env.SMTP_USER}>`,
      to      : process.env.OWNER_EMAIL,
      replyTo : email,
      subject : `🔥 New Chatbot Lead — dilshadesigns.vercel.app`,
      text    : `
New chatbot lead captured!

Email  : ${email}
Time   : ${getISTTime()} IST
Source : Chatbot Lead Capture — dilshadesigns.vercel.app

Reply to them quickly — leads go cold fast!
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<body style="
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f4f7f6;
">

  <div style="max-width: 560px; margin: 0 auto;">

    ${emailHeader('🔥 New Chatbot Lead!', 'dilshadesigns.vercel.app')}

    <div style="
      background: #ffffff;
      border: 1px solid #e5ede9;
      border-top: none;
      padding: 28px 32px;
    ">

      <p style="color:#1a2e26; font-size:0.95rem; margin-top:0;">
        Someone is interested in your services and left their email via the chatbot!
      </p>

      <table style="width:100%; border-collapse:collapse; margin:16px 0;">
        <tr style="border-bottom: 1px solid #f0f4f2;">
          <td style="padding:10px 0; font-weight:600; color:#5a7a6e; width:100px; font-size:0.88rem;">Email</td>
          <td style="padding:10px 0;">
            <a href="mailto:${email}"
               style="color:#2F7A66; font-weight:700; font-size:0.95rem; text-decoration:none;">
              ${email}
            </a>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #f0f4f2;">
          <td style="padding:10px 0; font-weight:600; color:#5a7a6e; font-size:0.88rem;">Time</td>
          <td style="padding:10px 0; color:#1a2e26; font-size:0.95rem;">${getISTTime()} IST</td>
        </tr>
        <tr>
          <td style="padding:10px 0; font-weight:600; color:#5a7a6e; font-size:0.88rem;">Source</td>
          <td style="padding:10px 0; color:#1a2e26; font-size:0.95rem;">Chatbot Lead Capture</td>
        </tr>
      </table>

      <div style="
        background: #fffbeb;
        border: 1px solid #fcd34d;
        border-left: 3px solid #f59e0b;
        border-radius: 8px;
        padding: 14px 18px;
        margin: 16px 0;
      ">
        <p style="margin:0; color:#92400e; font-weight:700; font-size:0.9rem;">
          ⚡ Reply quickly — leads go cold fast!
        </p>
      </div>

      ${emailButton(
        `mailto:${email}?subject=Your Interest in Dilshad Designs&body=Hi there,%0D%0A%0D%0AThank you for your interest in Dilshad Designs!%0D%0A%0D%0AI would love to discuss your project and provide a custom quote.%0D%0A%0D%0ABest regards,%0D%0ADilshad`,
        'Reply to This Lead'
      )}

    </div>

    ${emailFooter()}

  </div>

</body>
</html>
      `.trim()
    };

    // ── Auto reply to the lead ──────────────────────────────────────────
    const autoReplyOptions = {
      from    : `"Dilshad Designs" <${process.env.SMTP_USER}>`,
      to      : email,
      subject : `Thanks for your interest! — Dilshad Designs`,
      text    : `
Hi there!

Thank you for your interest in Dilshad Designs!

I have received your email and will reach out to you shortly.

While you wait check out my work:
Portfolio : https://dilshadesigns.vercel.app
Fiverr    : https://www.fiverr.com/dilshadesigns
Instagram : https://www.instagram.com/dilshadesigns

Best regards,
Dilshad
Dilshad Designs | New Delhi, India
+91 11499 53616
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<body style="
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f4f7f6;
">

  <div style="max-width: 560px; margin: 0 auto;">

    ${emailHeader('Thanks for your interest! 👋', 'Dilshad Designs')}

    <div style="
      background: #ffffff;
      border: 1px solid #e5ede9;
      border-top: none;
      padding: 28px 32px;
    ">

      <p style="color:#1a2e26; font-size:0.95rem; margin-top:0;">
        Hi there!
      </p>

      <p style="color:#1a2e26; font-size:0.95rem; line-height:1.7;">
        Thank you for your interest in Dilshad Designs! 🎨
      </p>

      <p style="color:#1a2e26; font-size:0.95rem; line-height:1.7;">
        I have received your email and will reach out to you shortly
        with information about my services and pricing.
      </p>

      <div style="
        background: #f8faf9;
        border: 1px solid #e5ede9;
        border-left: 3px solid #2F7A66;
        border-radius: 8px;
        padding: 18px 20px;
        margin: 20px 0;
      ">
        <p style="
          margin: 0 0 12px;
          font-weight: 700;
          color: #1a2e26;
          font-size: 0.9rem;
        ">While you wait check out my work:</p>

        <p style="margin:6px 0; font-size:0.9rem;">
          🌐 <a href="https://dilshadesigns.vercel.app"
                style="color:#2F7A66; font-weight:600; text-decoration:none;">
            dilshadesigns.vercel.app
          </a>
        </p>
        <p style="margin:6px 0; font-size:0.9rem;">
          🛒 <a href="https://www.fiverr.com/dilshadesigns"
                style="color:#2F7A66; font-weight:600; text-decoration:none;">
            fiverr.com/dilshadesigns
          </a>
        </p>
        <p style="margin:6px 0; font-size:0.9rem;">
          📸 <a href="https://www.instagram.com/dilshadesigns"
                style="color:#2F7A66; font-weight:600; text-decoration:none;">
            @dilshadesigns
          </a>
        </p>
      </div>

      <p style="color:#1a2e26; font-size:0.95rem; line-height:1.7; margin-bottom:0;">
        Best regards,<br>
        <strong>Dilshad</strong><br>
        <span style="color:#5a7a6e; font-size:0.88rem;">
          Dilshad Designs | New Delhi, India<br>
          📱 +91 11499 53616
        </span>
      </p>

    </div>

    ${emailFooter()}

  </div>

</body>
</html>
      `.trim()
    };

    // Save to MongoDB (upsert — skip if email already exists)
    await Lead.findOneAndUpdate(
      { email },
      { email, source: 'chatbot' },
      { upsert: true, new: true }
    );

    // Send both emails concurrently
    await Promise.all([
      transporter.sendMail(ownerMailOptions),
      transporter.sendMail(autoReplyOptions),
    ]);

    return res.status(200).json({
      success : true,
      message : "Thank you! We will be in touch soon."
    });

  } catch (err) {
    console.error('[contactController] Lead email failed:', err.message);
    return next({
      status  : 500,
      message : 'Failed to save your email. Please try again.'
    });
  }
};