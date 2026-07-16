import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Load environment variables for email configurations
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || '"Wonder Wedding Alerts" <alerts@wonderwedding.com>';

const logFilePath = path.join(__dirname, '../../logs/sent_emails.log');

// Ensure log directory exists
try {
  const dir = path.dirname(logFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create logs directory:', err);
}

// Initialize transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) return transporter;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    // Configured SMTP
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  } else {
    // Local development mock transporter using Ethereal email
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('Mailer initialized with Ethereal Mock SMTP. User:', testAccount.user);
    } catch (err) {
      // Fallback if ethereal offline
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows',
        buffer: true
      });
      console.log('Mailer initialized with StreamTransport fallback.');
    }
  }

  return transporter;
};

// Log email locally for inspection
const logEmailLocally = (to: string, subject: string, body: string) => {
  const logEntry = `
========================================
TIMESTAMP: ${new Date().toISOString()}
TO: ${to}
SUBJECT: ${subject}
BODY:
${body}
========================================
`;
  try {
    fs.appendFileSync(logFilePath, logEntry, 'utf8');
    console.log(`[MAIL LOGGED] Email to <${to}> logged in backend/logs/sent_emails.log`);
  } catch (err) {
    console.error('Failed to write email log file:', err);
  }
};

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const mailTransporter = await getTransporter();
    
    // Log to console/local file
    logEmailLocally(to, subject, text);

    const info = await mailTransporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>')
    });

    if (info.messageId) {
      console.log(`[MAIL SENT] Message ID: ${info.messageId}`);
      // If ethereal mock, output URL to preview it
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[MAIL PREVIEW URL] View email: ${previewUrl}`);
        fs.appendFileSync(logFilePath, `PREVIEW URL: ${previewUrl}\n========================================\n`, 'utf8');
      }
    }
    return info;
  } catch (err) {
    console.error('Failed to send email notification:', err);
  }
};

/**
 * Send Welcome Email containing credentials and wedding space details
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string,
  role: string,
  weddingName: string,
  passwordPlaceholder: string
) => {
  const subject = `Welcome to your Wonder Wedding Workspace: ${weddingName}`;
  const text = `
Hello ${name},

You have been added as a ${role} member for the wedding planning workspace: "${weddingName}".

Here are your login credentials:
- URL: http://localhost:3000/login
- Email: ${email}
- Temporary Password: ${passwordPlaceholder}

Please login and change your password as soon as possible.

Best regards,
The Wonder Wedding Platform Team
`;

  const html = `
<div style="font-family: sans-serif; padding: 20px; color: #2d1d20; background-color: #faf6f7; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #f0e2e4;">
  <h2 style="color: #c25e66; border-bottom: 2px solid #ecdce0; padding-bottom: 10px;">Welcome to Wonder Wedding!</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>You have been registered as a <strong>${role}</strong> member for the wedding workspace: <span style="color: #8ea491; font-weight: bold;">"${weddingName}"</span>.</p>
  
  <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border-left: 4px solid #c25e66; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
    <p style="margin: 5px 0;"><strong>Link:</strong> <a href="http://localhost:3000/login" style="color: #8ea491;">http://localhost:3000/login</a></p>
    <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
    <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #faf0f1; padding: 2px 6px; border-radius: 4px; color: #ab444c;">${passwordPlaceholder}</code></p>
  </div>
  
  <p>Please log in and update your password immediately in your profile settings.</p>
  <p style="margin-top: 30px; font-size: 12px; color: #718874; border-top: 1px solid #ecdce0; padding-top: 15px;">
    Best regards,<br>
    The Wonder Wedding Platform Team
  </p>
</div>
`;

  await sendEmail(email, subject, text, html);
};

/**
 * Send Task Assignment Email Alert
 */
export const sendTaskAssignmentEmail = async (
  email: string,
  name: string,
  taskName: string,
  dueDate: Date,
  weddingName: string
) => {
  const formattedDate = new Date(dueDate).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `New Task Assigned: "${taskName}" - ${weddingName}`;
  const text = `
Hello ${name},

A new task has been assigned to you in the wedding workspace "${weddingName}":

Task Name: ${taskName}
Due Date: ${formattedDate}

Please check your planner suite dashboard to see details and update progress.

Best regards,
Wonder Wedding Suite Alert System
`;

  const html = `
<div style="font-family: sans-serif; padding: 20px; color: #2d1d20; background-color: #faf6f7; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #f0e2e4;">
  <h2 style="color: #c25e66; border-bottom: 2px solid #ecdce0; padding-bottom: 10px;">New Task Assigned</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>A new task has been assigned to you in the wedding workspace: <span style="color: #8ea491; font-weight: bold;">"${weddingName}"</span>.</p>
  
  <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border-left: 4px solid #8ea491; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Task Name:</strong> ${taskName}</p>
    <p style="margin: 5px 0;"><strong>Due Date:</strong> <span style="color: #ab444c; font-weight: bold;">${formattedDate}</span></p>
  </div>
  
  <p>Log in to your dashboard to view the checklists, post comments, or update the task's completion status.</p>
  <p style="margin-top: 30px; font-size: 12px; color: #718874; border-top: 1px solid #ecdce0; padding-top: 15px;">
    Best regards,<br>
    Wonder Wedding Suite Alert System
  </p>
</div>
`;

  await sendEmail(email, subject, text, html);
};
