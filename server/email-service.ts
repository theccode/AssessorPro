import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email credentials not found. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD environment variables.');
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"GREDA Green Building Assessment" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendInvitationEmail(
    email: string,
    inviterName: string,
    role: string,
    organizationName: string | undefined,
    invitationToken: string,
    invitationLink: string
  ): Promise<void> {
    const subject = `Invitation to join GREDA Green Building Assessment Platform`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>GREDA Platform Invitation</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .email-container {
              background-color: white;
              border-radius: 8px;
              padding: 40px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .invitation-button {
              display: inline-block;
              background-color: #2563eb;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .details {
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo">GREDA</div>
              <h1>You're Invited!</h1>
            </div>
            
            <p>Hello,</p>
            
            <p><strong>${inviterName}</strong> has invited you to join the <strong>GREDA Green Building Assessment Platform</strong> as a <strong>${role}</strong>.</p>
            
            ${organizationName ? `<p><strong>Building Name:</strong> ${organizationName}</p>` : ''}
            
            <div class="details">
              <h3>About GREDA Platform</h3>
              <p>Our comprehensive Green Building Certification Tool enables detailed sustainability assessments for residential buildings with enterprise-grade features and intelligent reporting capabilities.</p>
            </div>
            
            <p>To accept your invitation and create your account, click the button below:</p>
            
            <div style="text-align: center;">
              <a href="${invitationLink}" class="invitation-button">Accept Invitation</a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background-color: #f8fafc; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">${invitationLink}</p>
            
            <p><strong>Important:</strong> This invitation will expire in 7 days.</p>
            
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>© ${new Date().getFullYear()} GREDA Green Building Assessment Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
GREDA Green Building Assessment Platform - Invitation

Hello,

${inviterName} has invited you to join the GREDA Green Building Assessment Platform as a ${role}.

${organizationName ? `Building Name: ${organizationName}` : ''}

About GREDA Platform:
Our comprehensive Green Building Certification Tool enables detailed sustainability assessments for residential buildings with enterprise-grade features and intelligent reporting capabilities.

To accept your invitation, visit: ${invitationLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export const emailService = new EmailService();