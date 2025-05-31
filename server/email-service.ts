import Mailgun from 'mailgun.js';
import formData from 'form-data';

const mailgun = new Mailgun(formData);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private mg: any;
  private domain: string;

  constructor() {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      throw new Error('Mailgun credentials not found. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.');
    }

    this.mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });
    this.domain = process.env.MAILGUN_DOMAIN;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const messageData = {
        from: `GREDA Green Building Assessment <noreply@${this.domain}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      await this.mg.messages.create(this.domain, messageData);
      console.log(`Email sent successfully to ${options.to}`);
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
              font-weight: 500;
              margin: 20px 0;
            }
            .invitation-button:hover {
              background-color: #1d4ed8;
            }
            .details {
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo">GREDA</div>
              <h1>Green Building Assessment Platform</h1>
            </div>
            
            <h2>You've been invited!</h2>
            
            <p>Hello,</p>
            
            <p><strong>${inviterName}</strong> has invited you to join the GREDA Green Building Assessment Platform as a <strong>${role}</strong>.</p>
            
            ${organizationName ? `<p>Organization: <strong>${organizationName}</strong></p>` : ''}
            
            <div class="details">
              <h3>About GREDA Platform</h3>
              <p>Our comprehensive Green Building Certification Tool enables detailed sustainability assessments for residential buildings with enterprise-grade features and intelligent reporting capabilities.</p>
              
              <p>As a <strong>${role}</strong>, you'll have access to:</p>
              <ul>
                ${role === 'admin' ? `
                  <li>Full system administration and user management</li>
                  <li>Complete assessment oversight and reporting</li>
                  <li>Enterprise-level analytics and insights</li>
                ` : role === 'assessor' ? `
                  <li>Assessment creation and management tools</li>
                  <li>Advanced form builders and data collection</li>
                  <li>Professional reporting and analytics</li>
                ` : `
                  <li>View your building assessment reports</li>
                  <li>Track sustainability progress over time</li>
                  <li>Access to certification documentation</li>
                `}
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${invitationLink}" class="invitation-button">Accept Invitation</a>
            </div>
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">${invitationLink}</p>
            
            <p><strong>Important:</strong> This invitation will expire in 7 days. Please accept it soon to gain access to the platform.</p>
            
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>This is an automated message from the GREDA Green Building Assessment Platform.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
GREDA Green Building Assessment Platform - Invitation

Hello,

${inviterName} has invited you to join the GREDA Green Building Assessment Platform as a ${role}.

${organizationName ? `Organization: ${organizationName}` : ''}

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