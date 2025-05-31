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
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              padding: 40px 20px;
              min-height: 100vh;
            }
            .email-wrapper {
              max-width: 650px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              text-align: center;
              padding: 50px 40px;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              animation: shimmer 3s ease-in-out infinite;
            }
            @keyframes shimmer {
              0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.3; }
              50% { transform: scale(1.1) rotate(180deg); opacity: 0.1; }
            }
            .logo {
              font-size: 36px;
              font-weight: 900;
              letter-spacing: 2px;
              margin-bottom: 15px;
              position: relative;
              z-index: 2;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 600;
              margin-bottom: 10px;
              position: relative;
              z-index: 2;
            }
            .header p {
              font-size: 16px;
              opacity: 0.9;
              position: relative;
              z-index: 2;
            }
            .content {
              padding: 50px 40px;
            }
            .invitation-card {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 15px;
              padding: 30px;
              margin: 30px 0;
              border-left: 5px solid #10b981;
            }
            .invitation-card h3 {
              color: #1e293b;
              font-size: 18px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
            }
            .invitation-card h3::before {
              content: '🏢';
              margin-right: 10px;
              font-size: 20px;
            }
            .role-badge {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              text-transform: capitalize;
              margin: 10px 0;
            }
            .building-name {
              background: white;
              padding: 15px 20px;
              border-radius: 10px;
              margin: 15px 0;
              border: 2px dashed #cbd5e1;
              text-align: center;
            }
            .cta-section {
              text-align: center;
              margin: 40px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 18px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 700;
              font-size: 16px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              transition: all 0.3s ease;
              box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
            }
            .features-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin: 30px 0;
            }
            .feature-item {
              background: white;
              padding: 25px;
              border-radius: 12px;
              text-align: center;
              border: 1px solid #e2e8f0;
              transition: transform 0.3s ease;
            }
            .feature-icon {
              font-size: 32px;
              margin-bottom: 15px;
              display: block;
            }
            .feature-title {
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 8px;
            }
            .feature-desc {
              font-size: 14px;
              color: #64748b;
            }
            .link-section {
              background: #f1f5f9;
              padding: 20px;
              border-radius: 10px;
              margin: 25px 0;
            }
            .link-text {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              color: #475569;
              word-break: break-all;
              padding: 10px;
              background: white;
              border-radius: 6px;
              border: 1px solid #cbd5e1;
            }
            .footer {
              background: #f8fafc;
              padding: 30px 40px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer-text {
              font-size: 13px;
              color: #64748b;
              margin-bottom: 10px;
            }
            .expiry-notice {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 1px solid #f59e0b;
              border-radius: 10px;
              padding: 20px;
              margin: 25px 0;
              text-align: center;
            }
            .expiry-notice strong {
              color: #92400e;
            }
            @media (max-width: 600px) {
              body { padding: 20px 10px; }
              .content { padding: 30px 25px; }
              .header { padding: 40px 25px; }
              .logo { font-size: 28px; }
              .header h1 { font-size: 24px; }
              .features-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="logo">GREDA</div>
              <h1>🎉 You're Invited!</h1>
              <p>Join the future of sustainable building assessment</p>
            </div>
            
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">Hello there!</p>
              
              <div class="invitation-card">
                <h3>Invitation Details</h3>
                <p><strong>${inviterName}</strong> has invited you to join the <strong>GREDA Green Building Assessment Platform</strong></p>
                <div class="role-badge">${role}</div>
                ${organizationName ? `
                  <div class="building-name">
                    <strong>🏢 Building Name:</strong> ${organizationName}
                  </div>
                ` : ''}
              </div>

              <div class="features-grid">
                <div class="feature-item">
                  <span class="feature-icon">🌱</span>
                  <div class="feature-title">Sustainability Assessment</div>
                  <div class="feature-desc">Comprehensive green building evaluations</div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📊</span>
                  <div class="feature-title">Smart Reporting</div>
                  <div class="feature-desc">Intelligent analytics and insights</div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🏆</span>
                  <div class="feature-title">Certification Ready</div>
                  <div class="feature-desc">Enterprise-grade compliance tools</div>
                </div>
              </div>

              <div class="cta-section">
                <p style="margin-bottom: 25px; font-size: 16px;">Ready to get started? Accept your invitation below:</p>
                <a href="${invitationLink}" class="cta-button">Accept Invitation</a>
              </div>

              <div class="link-section">
                <p style="margin-bottom: 10px; font-size: 14px; color: #64748b;">Or copy and paste this link in your browser:</p>
                <div class="link-text">${invitationLink}</div>
              </div>

              <div class="expiry-notice">
                <strong>⏰ Important:</strong> This invitation will expire in 7 days.
              </div>
            </div>

            <div class="footer">
              <div class="footer-text">If you didn't expect this invitation, you can safely ignore this email.</div>
              <div class="footer-text">© ${new Date().getFullYear()} GREDA Green Building Assessment Platform - Building a sustainable future</div>
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