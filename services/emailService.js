// ===== Email Service =====
// This module handles email delivery for notifications, announcements, and system messages
// Integrates with Resend API for reliable email delivery

const { Resend } = require('resend');
const path = require('path');
const fs = require('fs');

class EmailService {
  constructor() {
    this.resend = null;
    this.emailQueue = [];
    this.isProcessing = false;
    this.initialize();
  }

  /**
   * Initialize the Resend client with API key
   */
  initialize() {
    try {
      const apiKey = process.env.RESEND_API_KEY;

      // Only initialize if API key is provided
      if (apiKey && apiKey !== 'your_resend_api_key_here') {
        this.resend = new Resend(apiKey);
        console.log('[EMAIL] Email service initialized with Resend API');
      } else {
        console.warn('[EMAIL] Resend API key not configured - email service in development mode');
      }
    } catch (error) {
      console.error('[EMAIL] Error initializing email service:', error);
    }
  }

  /**
   * Load and compile HTML email template
   * @param {string} templateName - Name of the template file (without .html extension)
   * @param {Object} data - Data to replace placeholders in template
   * @returns {string} Compiled HTML
   */
  loadTemplate(templateName, data = {}) {
    try {
      const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
      
      if (!fs.existsSync(templatePath)) {
        console.warn(`[EMAIL] Template not found: ${templateName}, using fallback`);
        return this.getDefaultTemplate(templateName, data);
      }

      let html = fs.readFileSync(templatePath, 'utf-8');

      // Replace all placeholders with actual data
      Object.keys(data).forEach(key => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(placeholder, data[key] || '');
      });

      return html;
    } catch (error) {
      console.error(`[EMAIL] Error loading template ${templateName}:`, error);
      return this.getDefaultTemplate(templateName, data);
    }
  }

  /**
   * Get default email template based on type
   * @param {string} type - Email type
   * @param {Object} data - Template data
   * @returns {string} HTML template
   */
  getDefaultTemplate(type, data) {
    const commonStyles = `
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #cce5ff; color: #004085; padding: 20px; border-radius: 5px 5px 0 0; border: 2px solid #004085; }
      .content { padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
      .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; 
                text-decoration: none; border-radius: 5px; margin-top: 10px; }
      .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
      .badge { display: inline-block; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
      .badge-success { background: #28a745; color: white; }
      .badge-warning { background: #ffc107; color: black; }
      .badge-danger { background: #dc3545; color: white; }
    `;

    const templates = {
      'announcement': `
        <html>
          <head><style>${commonStyles}</style></head>
          <body>
            <div class="container">
              <div class="header">
                <h2>📢 New Announcement</h2>
              </div>
              <div class="content">
                <p>Hi ${data.recipientName},</p>
                <p>A new announcement has been posted:</p>
                <h3>${data.title}</h3>
                <p>${data.content}</p>
                <p><strong>Priority:</strong> <span class="badge badge-${data.priorityClass}">${data.priority}</span></p>
                <a href="${data.actionUrl}" class="button">View Full Announcement</a>
                <div class="footer">
                  <p>This is an automated message from S-CORE. Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      'request_update': `
        <html>
          <head><style>${commonStyles}</style></head>
          <body>
            <div class="container">
              <div class="header">
                <h2>📋 Request Update</h2>
              </div>
              <div class="content">
                <p>Hi ${data.recipientName},</p>
                <p>Your request has been updated:</p>
                <p><strong>Request ID:</strong> ${data.requestId}</p>
                <p><strong>Status:</strong> <span class="badge badge-${data.statusClass}">${data.status}</span></p>
                <p><strong>Update:</strong> ${data.message}</p>
                <a href="${data.actionUrl}" class="button">View Request</a>
                <div class="footer">
                  <p>This is an automated message from S-CORE. Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      'password_reset': `
        <html>
          <head><style>${commonStyles}</style></head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🔐 Password Reset Request</h2>
              </div>
              <div class="content">
                <p>Hi ${data.recipientName},</p>
                <p>You requested to reset your password. Click the button below to proceed:</p>
                <a href="${data.resetLink}" class="button">Reset Password</a>
                <p><strong>Note:</strong> This link expires in 1 hour.</p>
                <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
                <div class="footer">
                  <p>This is an automated message from S-CORE. Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      'approval_pending': `
        <html>
          <head><style>${commonStyles}</style></head>
          <body>
            <div class="container">
              <div class="header">
                <h2>⏳ Approval Pending</h2>
              </div>
              <div class="content">
                <p>Hi ${data.recipientName},</p>
                <p>Your request is pending approval:</p>
                <p><strong>Request ID:</strong> ${data.requestId}</p>
                <p><strong>Type:</strong> ${data.requestType}</p>
                <p><strong>Submitted:</strong> ${data.submittedDate}</p>
                <a href="${data.actionUrl}" class="button">View Request</a>
                <div class="footer">
                  <p>This is an automated message from S-CORE. Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      'default': `
        <html>
          <head><style>${commonStyles}</style></head>
          <body>
            <div class="container">
              <div class="header">
                <h2>${data.title || 'Notification'}</h2>
              </div>
              <div class="content">
                <p>Hi ${data.recipientName},</p>
                <p>${data.message}</p>
                ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">View Details</a>` : ''}
                <div class="footer">
                  <p>This is an automated message from S-CORE. Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    };

    return templates[type] || templates['default'];
  }

  /**
   * Add email to queue for sending
   * @param {Object} emailData - Email configuration object
   * @returns {Promise} Queued email promise
   */
  async queueEmail(emailData) {
    return new Promise((resolve) => {
      this.emailQueue.push({ emailData, resolve });
      this.processQueue();
    });
  }

  /**
   * Process queued emails one by one
   */
  async processQueue() {
    if (this.isProcessing || this.emailQueue.length === 0) return;

    this.isProcessing = true;

    while (this.emailQueue.length > 0) {
      const { emailData, resolve } = this.emailQueue.shift();
      try {
        const result = await this.sendEmail(emailData);
        resolve({ success: true, result });
      } catch (error) {
        console.error('[EMAIL] Error sending queued email:', error);
        resolve({ success: false, error: error.message });
      }
    }

    this.isProcessing = false;
  }

  /**
   * Send email
   * @param {Object} emailData - Email configuration
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.template - Template name or 'default'
   * @param {Object} emailData.data - Template data
   * @returns {Promise} Send result
   */
  async sendEmail(emailData) {
    try {
      const { to, subject, template = 'default', data = {} } = emailData;

      // Validate email address
      if (!to || !this.isValidEmail(to)) {
        throw new Error(`Invalid email address: ${to}`);
      }

      // If no Resend client, log and return success (development mode)
      if (!this.resend) {
        console.log(`[EMAIL] Development mode - would send email to: ${to}`);
        console.log(`[EMAIL] Subject: ${subject}`);
        console.log(`[EMAIL] Template: ${template}`);
        return { success: true, message: 'Development mode - email not sent' };
      }

      // Load template
      const html = this.loadTemplate(template, data);

      // Send email using Resend
      const result = await this.resend.emails.send({
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to: to,
        subject: subject,
        html: html
      });

      console.log(`[EMAIL] Email sent successfully to ${to}`);
      return { success: true, id: result.id };
    } catch (error) {
      console.error('[EMAIL] Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send announcement email to recipients
   * @param {string} recipientEmail - Recipient email address
   * @param {Object} announcement - Announcement object
   * @returns {Promise} Send result
   */
  async sendAnnouncementEmail(recipientEmail, announcement) {
    try {
      const templateData = {
        recipientName: 'User',
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        priorityClass: this.getPriorityClass(announcement.priority),
        actionUrl: `${process.env.APP_URL || 'http://localhost:8080'}/announcements`
      };

      return await this.queueEmail({
        to: recipientEmail,
        subject: `📢 New Announcement: ${announcement.title}`,
        template: 'announcement',
        data: templateData
      });
    } catch (error) {
      console.error('[EMAIL] Error sending announcement email:', error);
      throw error;
    }
  }

  /**
   * Send request update email
   * @param {string} recipientEmail - Recipient email
   * @param {Object} request - Request object
   * @param {string} message - Update message
   * @returns {Promise} Send result
   */
  async sendRequestUpdateEmail(recipientEmail, request, message) {
    try {
      const templateData = {
        recipientName: 'User',
        requestId: request._id || request.id,
        status: request.status,
        statusClass: this.getStatusClass(request.status),
        message: message,
        actionUrl: `${process.env.APP_URL || 'http://localhost:8080'}/requests/${request._id}`
      };

      return await this.queueEmail({
        to: recipientEmail,
        subject: `📋 Request Update: ${request._id}`,
        template: 'request_update',
        data: templateData
      });
    } catch (error) {
      console.error('[EMAIL] Error sending request update email:', error);
      throw error;
    }
  }

  /**
   * Send approval pending notification email
   * @param {string} recipientEmail - Recipient email
   * @param {Object} approvalRequest - Approval request object
   * @returns {Promise} Send result
   */
  async sendApprovalPendingEmail(recipientEmail, approvalRequest) {
    try {
      const templateData = {
        recipientName: 'User',
        requestId: approvalRequest._id,
        requestType: approvalRequest.specificRequestType,
        submittedDate: new Date(approvalRequest.createdAt).toLocaleDateString(),
        actionUrl: `${process.env.APP_URL || 'http://localhost:8080'}/approval/${approvalRequest._id}`
      };

      return await this.queueEmail({
        to: recipientEmail,
        subject: `⏳ Approval Pending: ${approvalRequest.specificRequestType}`,
        template: 'approval_pending',
        data: templateData
      });
    } catch (error) {
      console.error('[EMAIL] Error sending approval pending email:', error);
      throw error;
    }
  }

  /**
   * Send bulk emails to multiple recipients
   * @param {Array<string>} recipients - Array of email addresses
   * @param {string} subject - Email subject
   * @param {string} template - Template name
   * @param {Object} templateData - Template data
   * @returns {Promise<Array>} Array of results
   */
  async sendBulkEmail(recipients, subject, template, templateData) {
    try {
      const results = await Promise.all(
        recipients.map(email =>
          this.queueEmail({
            to: email,
            subject: subject,
            template: template,
            data: templateData
          })
        )
      );

      console.log(`[EMAIL] Bulk email sent to ${recipients.length} recipients`);
      return results;
    } catch (error) {
      console.error('[EMAIL] Error sending bulk emails:', error);
      throw error;
    }
  }

  /**
   * Validate email address format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Get CSS class for priority level
   * @param {string} priority - Priority level
   * @returns {string} CSS class name
   */
  getPriorityClass(priority) {
    const priorities = {
      'high': 'danger',
      'medium': 'warning',
      'low': 'success'
    };
    return priorities[priority] || 'info';
  }

  /**
   * Get CSS class for status
   * @param {string} status - Request status
   * @returns {string} CSS class name
   */
  getStatusClass(status) {
    const statuses = {
      'completed': 'success',
      'in-progress': 'info',
      'pending': 'warning',
      'cancelled': 'danger',
      'rejected': 'danger'
    };
    return statuses[status] || 'secondary';
  }

  /**
   * Send email verification link
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's full name
   * @param {string} verificationToken - Verification token
   * @returns {Promise} Send result
   */
  async sendEmailVerification(userEmail, userName, verificationToken) {
    try {
      const verificationLink = `${process.env.APP_URL}/auth/verify-email/${verificationToken}`;
      const expiryHours = process.env.EMAIL_VERIFICATION_EXPIRY || 24;

      const html = this.loadTemplate('email-verification', {
        userName,
        verificationLink,
        expiryHours
      });

      if (this.resend) {
        const result = await this.resend.emails.send({
          from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
          to: userEmail,
          subject: 'Verify Your Email Address - S-CORE',
          html
        });
        console.log(`[EMAIL] Verification email sent to ${userEmail}`);
        return { success: true, id: result.id };
      } else {
        console.log(`[EMAIL] Would send verification email to ${userEmail} (dev mode)`);
        console.log(`[EMAIL] Verification link: ${verificationLink}`);
        return { success: true, devMode: true, verificationLink };
      }
    } catch (error) {
      console.error('[EMAIL] Error sending verification email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's full name
   * @param {string} resetToken - Password reset token
   * @returns {Promise} Send result
   */
  async sendPasswordReset(userEmail, userName, resetToken) {
    try {
      const resetLink = `${process.env.APP_URL}/reset-password/${resetToken}`;

      const html = `
        <html>
          <head><style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #d4edda; color: #155724; padding: 20px; border-radius: 5px 5px 0 0; border: 2px solid #155724; }
            .content { padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background: #408b4e; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style></head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Password Reset Request</h2>
              </div>
              <div class="content">
                <p>Hi ${userName},</p>
                <p>We received a request to reset your password for your S-CORE account.</p>
                <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
                <a href="${resetLink}" class="button">Reset Password</a>
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
                  <strong>Please do not reply to this email.</strong><br>
                  This is an automated message from SCO Creative Optimization for Requests and Engagement System (S-CORE). 
                  For assistance, please contact the Student Communications Office directly.
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const mailOptions = {
        from: `"S-CORE - No Reply" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        replyTo: 'sco@dlsud.edu.ph',
        to: userEmail,
        subject: 'Password Reset Request - S-CORE',
        html
      };

      if (this.resend) {
        const result = await this.resend.emails.send({
          from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
          to: userEmail,
          subject: 'Reset Your Password - S-CORE',
          html: mailOptions.html
        });
        console.log(`[EMAIL] Password reset email sent to ${userEmail}`);
        return { success: true, id: result.id };
      } else {
        console.log(`[EMAIL] Would send password reset email to ${userEmail} (dev mode)`);
        console.log(`[EMAIL] Reset link: ${resetLink}`);
        return { success: true, devMode: true, resetLink };
      }
    } catch (error) {
      console.error('[EMAIL] Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send account approved notification
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's full name
   * @returns {Promise} Send result
   */
  async sendAccountApproved(userEmail, userName) {
    try {
      const loginLink = 'https://dlsuds-core.me/login';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Branding Section with White Background -->
                    <tr>
                      <td style="background-color: #ffffff; padding: 30px 30px 20px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; font-size: 48px; font-weight: 700; color: #2d5016; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 0;">S-CORE</h1><p style="margin: 8px 0 0 0; color: #2d5016; font-size: 14px; font-weight: 400; font-family: 'Playfair Display', Georgia, serif;">SCO Creative Optimization for Requests and Engagement System</p>
                      </td>
                    </tr>
                    <!-- Page Title Section with Dark Green Background -->
                    <tr>
                      <td style="background-color: #d4edda; padding: 30px; text-align: center; border: 2px solid #155724;">
                        <h2 style="margin: 0; color: #155724; font-size: 26px; font-weight: 600;">Account Approved</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #d4edda; border-left: 4px solid #28a745; margin: 0 0 25px 0;">
                          <tr>
                            <td style="padding: 25px; text-align: center;">
                              <strong style="display: block; margin: 0 0 10px 0; color: #155724; font-size: 22px; font-weight: 600;">Welcome to S-CORE</strong>
                              <p style="margin: 0; color: #155724;">Your account has been approved by an administrator</p>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 0 0 15px 0; color: #1a2e1a;">Hi <strong>${userName}</strong>,</p>
                        <p style="font-size: 16px; margin: 20px 0; color: #1a2e1a;"><strong>Good news!</strong> Your S-CORE account has been approved and is now active.</p>
                        <p style="color: #1a2e1a;">Your email has been verified and your account role is set to <span style="display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; background-color: #4caf50; color: white; font-size: 13px;">USER/REQUESTOR</span></p>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fdf8; border-left: 4px solid #1a5d1a; margin: 25px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <strong style="color: #1a5d1a; display: block; margin-bottom: 10px; font-size: 15px;">What you can do</strong>
                              <ul style="margin: 10px 0; padding-left: 20px;">
                                <li style="margin: 10px 0; color: #2d7a2d;">Submit service requests to the SCO</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Track your request statuses in real-time</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">View announcements and updates</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Manage your profile settings</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Receive notifications about your requests</li>
                              </ul>
                            </td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td align="center" style="background-color: #1a5d1a; border-radius: 6px;">
                                    <a href="${loginLink}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">Log In Now</a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff9e6; border: 2px solid #ffd700; margin: 25px 0;">
                          <tr>
                            <td style="padding: 25px; text-align: center;">
                              <strong style="display: block; font-size: 16px; color: #1a5d1a; margin-bottom: 8px;">Welcome to the SCO Creative Optimization for Requests and Engagement System</strong>
                              <span style="color: #6c757d; font-size: 14px;">We're excited to have you on board</span>
                            </td>
                          </tr>
                        </table>
                        <div style="height: 1px; background-color: #e0e0e0; margin: 25px 0;"></div>
                        <p style="color: #6c757d; font-size: 13px;">
                          This email was sent to your registered Microsoft Outlook account. Please keep this email for your records.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef;">
                        <strong style="color: #1a5d1a;">Please do not reply to this email.</strong><br><br>
                        This is an automated message from <strong style="color: #1a5d1a;">S-CORE</strong><br>
                        (SCO Creative Optimization for Requests and Engagement System)<br><br>
                        <strong>Strategic Communications Office</strong><br>
                        De La Salle University - Dasmarinas<br><br>
                        For assistance, contact us at <a href="mailto:sco@dlsud.edu.ph" style="color: #1a5d1a; text-decoration: none;">sco@dlsud.edu.ph</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      if (this.resend) {
        const result = await this.resend.emails.send({
          from: `S-CORE - No Reply <${process.env.SMTP_FROM_EMAIL}>`,
          reply_to: 'sco@dlsud.edu.ph',
          to: userEmail,
          subject: 'Your S-CORE Account Has Been Approved',
          html
        });
        console.log(`[EMAIL] ✅ Account approved email sent successfully to ${userEmail}`);
        console.log(`[EMAIL] Message ID: ${result.id}`);
        return { success: true, id: result.id };
      } else {
        console.log(`[EMAIL] Would send account approved email to ${userEmail} (dev mode)`);
        return { success: true, devMode: true };
      }
    } catch (error) {
      console.error('[EMAIL] ❌ Error sending account approved email:', error.message);
      console.error('[EMAIL] Full error:', error);
      throw error;
    }
  }

  /**
   * Send account denied notification
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's full name
   * @returns {Promise} Send result
   */
  async sendAccountDenied(userEmail, userName) {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Branding Section with White Background -->
                    <tr>
                      <td style="background-color: #ffffff; padding: 30px 30px 20px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; font-size: 48px; font-weight: 700; color: #2d5016; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 0;">S-CORE</h1><p style="margin: 8px 0 0 0; color: #2d5016; font-size: 14px; font-weight: 400; font-family: 'Playfair Display', Georgia, serif;">SCO Creative Optimization for Requests and Engagement System</p>
                      </td>
                    </tr>
                    <!-- Page Title Section with Light Red Background -->
                    <tr>
                      <td style="background-color: #f8d7da; padding: 30px; text-align: center; border: 2px solid #721c24;">
                        <h2 style="margin: 0; color: #721c24; font-size: 26px; font-weight: 600;">Account Registration Update</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8d7da; border-left: 4px solid #dc3545; margin: 0 0 25px 0;">
                          <tr>
                            <td style="padding: 25px; text-align: center;">
                              <strong style="color: #721c24; font-size: 18px;">Account Registration Not Approved</strong>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 0 0 15px 0; color: #1a2e1a;">Hi <strong>${userName}</strong>,</p>
                        <p style="color: #1a2e1a;">We regret to inform you that your account registration for the SCO Creative Optimization for Requests and Engagement System (S-CORE) was not approved by an administrator.</p>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fdf8; border-left: 4px solid #1a5d1a; margin: 25px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <strong style="color: #1a5d1a; display: block; margin-bottom: 10px;">Need More Information?</strong>
                              If you believe this is an error or need further assistance, please contact the Strategic Communications Office directly.
                            </td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; margin: 30px 0;">
                          <tr>
                            <td style="padding: 20px; text-align: center;">
                              <strong style="display: block; margin-bottom: 10px; color: #1a5d1a;">Contact Us</strong>
                              <a href="mailto:sco@dlsud.edu.ph" style="color: #1a5d1a; text-decoration: none; font-weight: 600; font-size: 16px;">sco@dlsud.edu.ph</a>
                            </td>
                          </tr>
                        </table>
                        <div style="height: 1px; background-color: #e0e0e0; margin: 25px 0;"></div>
                        <p style="color: #6c757d; font-size: 13px;">
                          This email was sent to your registered Microsoft Outlook account.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef;">
                        <strong style="color: #1a5d1a;">Please do not reply to this email.</strong><br><br>
                        This is an automated message from <strong style="color: #1a5d1a;">S-CORE</strong><br>
                        (SCO Creative Optimization for Requests and Engagement System)<br><br>
                        <strong>Strategic Communications Office</strong><br>
                        De La Salle University - Dasmarinas<br><br>
                        For assistance, contact us at <a href="mailto:sco@dlsud.edu.ph" style="color: #1a5d1a; text-decoration: none;">sco@dlsud.edu.ph</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      if (this.resend) {
        const result = await this.resend.emails.send({
          from: `S-CORE - No Reply <${process.env.SMTP_FROM_EMAIL}>`,
          reply_to: 'sco@dlsud.edu.ph',
          to: userEmail,
          subject: 'S-CORE Account Registration - Not Approved',
          html
        });
        console.log(`[EMAIL] Account denied email sent to ${userEmail}`);
        return { success: true, id: result.id };
      } else {
        console.log(`[EMAIL] Would send account denied email to ${userEmail} (dev mode)`);
        return { success: true, devMode: true };
      }
    } catch (error) {
      console.error('[EMAIL] Error sending account denied email:', error);
      throw error;
    }
  }

  /**
   * Send account reset to pending notification
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's full name
   * @returns {Promise} Send result
   */
  async sendAccountResetToPending(userEmail, userName) {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Branding Section with White Background -->
                    <tr>
                      <td style="background-color: #ffffff; padding: 30px 30px 20px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; font-size: 48px; font-weight: 700; color: #2d5016; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 0;">S-CORE</h1><p style="margin: 8px 0 0 0; color: #2d5016; font-size: 14px; font-weight: 400; font-family: 'Playfair Display', Georgia, serif;">SCO Creative Optimization for Requests and Engagement System</p>
                      </td>
                    </tr>
                    <!-- Page Title Section with Light Yellow Background -->
                    <tr>
                      <td style="background-color: #fff3cd; padding: 30px; text-align: center; border: 2px solid #856404;">
                        <h2 style="margin: 0; color: #856404; font-size: 26px; font-weight: 600;">Account Status Updated</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; margin: 0 0 25px 0;">
                          <tr>
                            <td style="padding: 25px; text-align: center;">
                              <strong style="color: #856404; font-size: 18px;">Your account status has been reset to Pending Review</strong>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 0 0 15px 0; color: #1a2e1a;">Hi <strong>${userName}</strong>,</p>
                        <p style="color: #1a2e1a;">Your S-CORE account status has been reset to <strong>Pending</strong> and is awaiting administrator review.</p>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fdf8; border-left: 4px solid #1a5d1a; margin: 25px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <strong style="color: #1a5d1a; display: block; margin-bottom: 10px;">What This Means</strong>
                              Your account access has been temporarily suspended until an administrator reviews and approves your account again. You will receive another email once your account status is updated.
                            </td>
                          </tr>
                        </table>
                        <p style="color: #1a2e1a;">If you have any questions or concerns about this change, please contact the Strategic Communications Office.</p>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; margin: 30px 0;">
                          <tr>
                            <td style="padding: 20px; text-align: center;">
                              <strong style="display: block; margin-bottom: 10px; color: #1a5d1a;">Contact Us</strong>
                              <a href="mailto:sco@dlsud.edu.ph" style="color: #1a5d1a; text-decoration: none; font-weight: 600; font-size: 16px;">sco@dlsud.edu.ph</a>
                            </td>
                          </tr>
                        </table>
                        <div style="height: 1px; background-color: #e0e0e0; margin: 25px 0;"></div>
                        <p style="color: #6c757d; font-size: 13px;">
                          This email was sent to your registered Microsoft Outlook account.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef;">
                        <strong style="color: #1a5d1a;">Please do not reply to this email.</strong><br><br>
                        This is an automated message from <strong style="color: #1a5d1a;">S-CORE</strong><br>
                        (SCO Creative Optimization for Requests and Engagement System)<br><br>
                        <strong>Strategic Communications Office</strong><br>
                        De La Salle University - Dasmarinas<br><br>
                        For assistance, contact us at <a href="mailto:sco@dlsud.edu.ph" style="color: #1a5d1a; text-decoration: none;">sco@dlsud.edu.ph</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      if (this.resend) {
        const result = await this.resend.emails.send({
          from: `S-CORE - No Reply <${process.env.SMTP_FROM_EMAIL}>`,
          reply_to: 'sco@dlsud.edu.ph',
          to: userEmail,
          subject: 'S-CORE Account Status Updated',
          html
        });
        console.log(`[EMAIL] Account reset to pending email sent to ${userEmail}`);
        return { success: true, id: result.id };
      } else {
        console.log(`[EMAIL] Would send account reset to pending email to ${userEmail} (dev mode)`);
        return { success: true, devMode: true };
      }
    } catch (error) {
      console.error('[EMAIL] Error sending account reset to pending email:', error);
      throw error;
    }
  }

  /**
   * Send role changed to Admin notification
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's full name
   * @returns {Promise} Send result
   */
  async sendRoleChangedToAdmin(userEmail, userName) {
    try {
      const loginLink = 'https://dlsuds-core.me/login';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Branding Section with White Background -->
                    <tr>
                      <td style="background-color: #ffffff; padding: 30px 30px 20px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; font-size: 48px; font-weight: 700; color: #2d5016; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 0;">S-CORE</h1><p style="margin: 8px 0 0 0; color: #2d5016; font-size: 14px; font-weight: 400; font-family: 'Playfair Display', Georgia, serif;">SCO Creative Optimization for Requests and Engagement System</p>
                      </td>
                    </tr>
                    <!-- Page Title Section with Light Red Background -->
                    <tr>
                      <td style="background-color: #f8d7da; padding: 30px; text-align: center; border: 2px solid #721c24;">
                        <h2 style="margin: 0; color: #721c24; font-size: 26px; font-weight: 600;">Role Updated - Administrator Access</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 15px 0; color: #1a2e1a;">Hi <strong>${userName}</strong>,</p>
                        <p style="font-size: 16px; margin: 20px 0; color: #1a2e1a;">Your S-CORE account role has been updated to <span style="display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; background-color: #dc3545; color: white; font-size: 13px;">ADMINISTRATOR</span></p>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fdf8; border-left: 4px solid #1a5d1a; margin: 25px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <strong style="color: #1a5d1a; display: block; margin-bottom: 10px; font-size: 15px;">Administrator Privileges</strong>
                              <ul style="margin: 10px 0; padding-left: 20px;">
                                <li style="margin: 10px 0; color: #2d7a2d;">Managing user accounts and roles</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Accessing the admin dashboard</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Configuring system settings</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Viewing analytics and reports</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Managing all service requests</li>
                              </ul>
                            </td>
                          </tr>
                        </table>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff8f0; border-left: 4px solid #ff9800; margin: 25px 0;">
                          <tr>
                            <td style="padding: 20px; color: #856404;">
                              <strong>Important Notice:</strong> Please use these privileges responsibly. Administrator access gives you full control over the system.
                            </td>
                          </tr>
                        </table>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td align="center" style="background-color: #1a5d1a; border-radius: 6px;">
                                    <a href="${loginLink}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">Log In to Admin Dashboard</a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="height: 1px; background-color: #e0e0e0; margin: 25px 0;"></div>
                        <p style="color: #6c757d; font-size: 13px;">
                          This email was sent to your registered Microsoft Outlook account. If you did not expect this change, please contact another administrator immediately.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef;">
                        <strong style="color: #1a5d1a;">Please do not reply to this email.</strong><br><br>
                        This is an automated message from <strong style="color: #1a5d1a;">S-CORE</strong><br>
                        (SCO Creative Optimization for Requests and Engagement System)<br><br>
                        <strong>Strategic Communications Office</strong><br>
                        De La Salle University - Dasmarinas<br><br>
                        For assistance, contact us at <a href="mailto:sco@dlsud.edu.ph" style="color: #1a5d1a; text-decoration: none;">sco@dlsud.edu.ph</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      if (this.resend) {
        const result = await this.resend.emails.send({
          from: `S-CORE - No Reply <${process.env.SMTP_FROM_EMAIL}>`,
          reply_to: 'sco@dlsud.edu.ph',
          to: userEmail,
          subject: 'Your Role Has Been Updated to Administrator - S-CORE',
          html
        });
        console.log(`[EMAIL] ✅ Role changed to admin email sent successfully to ${userEmail}`);
        console.log(`[EMAIL] Message ID: ${result.id}`);
        return { success: true, id: result.id };
      } else {
        console.log(`[EMAIL] Would send role changed to admin email to ${userEmail} (dev mode)`);
        return { success: true, devMode: true };
      }
    } catch (error) {
      console.error('[EMAIL] ❌ Error sending role changed to admin email:', error.message);
      console.error('[EMAIL] Full error:', error);
      throw error;
    }
  }

  /**
   * Send role changed to Unit notification
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's full name
   * @param {string} unitTeam - Unit team name
   * @returns {Promise} Send result
   */
  async sendRoleChangedToUnit(userEmail, userName, unitTeam) {
    try {
      const loginLink = 'https://dlsuds-core.me/login';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Branding Section with White Background -->
                    <tr>
                      <td style="background-color: #ffffff; padding: 30px 30px 20px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; font-size: 48px; font-weight: 700; color: #2d5016; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 0;">S-CORE</h1><p style="margin: 8px 0 0 0; color: #2d5016; font-size: 14px; font-weight: 400; font-family: 'Playfair Display', Georgia, serif;">SCO Creative Optimization for Requests and Engagement System</p>
                      </td>
                    </tr>
                    <!-- Page Title Section with Light Blue Background -->
                    <tr>
                      <td style="background-color: #e3f2fd; padding: 30px; text-align: center; border: 2px solid #0d47a1;">
                        <h2 style="margin: 0; color: #0d47a1; font-size: 26px; font-weight: 600;">Role Updated - Unit Member Access</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 15px 0; color: #1a2e1a;">Hi <strong>${userName}</strong>,</p>
                        <p style="font-size: 16px; margin: 20px 0; color: #1a2e1a;">Your S-CORE account role has been updated to <span style="display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; background-color: #17a2b8; color: white; font-size: 13px;">UNIT MEMBER${unitTeam && unitTeam !== 'N/A' ? ` - ${unitTeam}` : ''}</span></p>
                        ${unitTeam && unitTeam !== 'N/A' ? `
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #e3f2fd; border-left: 4px solid #2196f3; margin: 25px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <strong style="color: #0d47a1;">Your Assigned Unit:</strong> ${unitTeam}
                            </td>
                          </tr>
                        </table>` : ''}
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fdf8; border-left: 4px solid #1a5d1a; margin: 25px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <strong style="color: #1a5d1a; display: block; margin-bottom: 10px; font-size: 15px;">Unit Member Privileges</strong>
                              <ul style="margin: 10px 0; padding-left: 20px;">
                                <li style="margin: 10px 0; color: #2d7a2d;">Managing service requests assigned to your unit</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Accessing the unit dashboard</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Viewing and updating task statuses</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Collaborating with team members</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Creating service reports</li>
                              </ul>
                            </td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td align="center" style="background-color: #1a5d1a; border-radius: 6px;">
                                    <a href="${loginLink}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">Log In to Unit Dashboard</a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <div style="height: 1px; background-color: #e0e0e0; margin: 25px 0;"></div>
                        <p style="color: #6c757d; font-size: 13px;">
                          This email was sent to your registered Microsoft Outlook account. If you did not expect this change, please contact an administrator.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef;">
                        <strong style="color: #1a5d1a;">Please do not reply to this email.</strong><br><br>
                        This is an automated message from <strong style="color: #1a5d1a;">S-CORE</strong><br>
                        (SCO Creative Optimization for Requests and Engagement System)<br><br>
                        <strong>Strategic Communications Office</strong><br>
                        De La Salle University - Dasmarinas<br><br>
                        For assistance, contact us at <a href="mailto:sco@dlsud.edu.ph" style="color: #1a5d1a; text-decoration: none;">sco@dlsud.edu.ph</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      if (this.resend) {
        const result = await this.resend.emails.send({
          from: `S-CORE - No Reply <${process.env.SMTP_FROM_EMAIL}>`,
          reply_to: 'sco@dlsud.edu.ph',
          to: userEmail,
          subject: 'Your Role Has Been Updated to Unit Member - S-CORE',
          html
        });
        console.log(`[EMAIL] ✅ Role changed to unit email sent successfully to ${userEmail}`);
        console.log(`[EMAIL] Message ID: ${result.id}`);
        return { success: true, id: result.id };
      } else {
        console.log(`[EMAIL] Would send role changed to unit email to ${userEmail} (dev mode)`);
        return { success: true, devMode: true };
      }
    } catch (error) {
      console.error('[EMAIL] ❌ Error sending role changed to unit email:', error.message);
      console.error('[EMAIL] Full error:', error);
      throw error;
    }
  }

  /**
   * Send role changed to User notification
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's full name
   * @returns {Promise} Send result
   */
  async sendRoleChangedToUser(userEmail, userName) {
    try {
      const loginLink = 'https://dlsuds-core.me/login';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Branding Section with White Background -->
                    <tr>
                      <td style="background-color: #ffffff; padding: 30px 30px 20px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; font-size: 48px; font-weight: 700; color: #2d5016; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 0;">S-CORE</h1><p style="margin: 8px 0 0 0; color: #2d5016; font-size: 14px; font-weight: 400; font-family: 'Playfair Display', Georgia, serif;">SCO Creative Optimization for Requests and Engagement System</p>
                      </td>
                    </tr>
                    <!-- Page Title Section with Light Green Background -->
                    <tr>
                      <td style="background-color: #d4edda; padding: 30px; text-align: center; border: 2px solid #155724;">
                        <h2 style="margin: 0; color: #155724; font-size: 26px; font-weight: 600;">Role Updated - User Access</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 15px 0; color: #1a2e1a;">Hi <strong>${userName}</strong>,</p>
                        <p style="font-size: 16px; margin: 20px 0; color: #1a2e1a;">Your S-CORE account role has been updated to <span style="display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; background-color: #4caf50; color: white; font-size: 13px;">USER/REQUESTOR</span></p>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fdf8; border-left: 4px solid #1a5d1a; margin: 25px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <strong style="color: #1a5d1a; display: block; margin-bottom: 10px; font-size: 15px;">Your Capabilities</strong>
                              <ul style="margin: 10px 0; padding-left: 20px;">
                                <li style="margin: 10px 0; color: #2d7a2d;">Submit service requests</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Track your request statuses</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">View announcements and updates</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Manage your profile</li>
                                <li style="margin: 10px 0; color: #2d7a2d;">Receive notifications about your requests</li>
                              </ul>
                            </td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td align="center" style="background-color: #1a5d1a; border-radius: 6px;">
                                    <a href="${loginLink}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">Log In to Your Account</a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <div style="height: 1px; background-color: #e0e0e0; margin: 25px 0;"></div>
                        <p style="color: #6c757d; font-size: 13px;">
                          This email was sent to your registered Microsoft Outlook account. If you did not expect this change, please contact an administrator.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef;">
                        <strong style="color: #1a5d1a;">Please do not reply to this email.</strong><br><br>
                        This is an automated message from <strong style="color: #1a5d1a;">S-CORE</strong><br>
                        (SCO Creative Optimization for Requests and Engagement System)<br><br>
                        <strong>Strategic Communications Office</strong><br>
                        De La Salle University - Dasmarinas<br><br>
                        For assistance, contact us at <a href="mailto:sco@dlsud.edu.ph" style="color: #1a5d1a; text-decoration: none;">sco@dlsud.edu.ph</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      if (this.resend) {
        const result = await this.resend.emails.send({
          from: `S-CORE - No Reply <${process.env.SMTP_FROM_EMAIL}>`,
          reply_to: 'sco@dlsud.edu.ph',
          to: userEmail,
          subject: 'Your Role Has Been Updated to User/Requestor - S-CORE',
          html
        });
        console.log(`[EMAIL] ✅ Role changed to user email sent successfully to ${userEmail}`);
        console.log(`[EMAIL] Message ID: ${result.id}`);
        return { success: true, id: result.id };
      } else {
        console.log(`[EMAIL] Would send role changed to user email to ${userEmail} (dev mode)`);
        return { success: true, devMode: true };
      }
    } catch (error) {
      console.error('[EMAIL] ❌ Error sending role changed to user email:', error.message);
      console.error('[EMAIL] Full error:', error);
      throw error;
    }
  }

  /**
   * Send user invitation email
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's name (if provided)
   * @param {string} invitationLink - Registration link with token
   * @param {Object} preFilledData - Pre-filled registration data
   * @returns {Promise} Send result
   */
  async sendUserInvitation(userEmail, userName, invitationLink, preFilledData = {}) {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #ffffff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; font-size: 48px; font-weight: 700; color: #2d5016; font-family: 'Playfair Display', Georgia, serif;">S-CORE</h1>
                        <p style="margin: 8px 0 0 0; color: #2d5016; font-size: 14px;">SCO Creative Optimization for Requests and Engagement System</p>
                      </td>
                    </tr>
                    <!-- Title -->
                    <tr>
                      <td style="background-color: #1a5d1a; padding: 30px; text-align: center;">
                        <h2 style="margin: 0; color: white; font-size: 26px;">You're Invited to Join S-CORE</h2>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">Hi ${userName},</p>
                        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">An administrator has invited you to create an account on <strong>S-CORE</strong>, the SCO Creative Optimization for Requests and Engagement System.</p>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #d4edda; border-left: 4px solid #28a745; margin: 25px 0;">
                          <tr>
                            <td style="padding: 20px;">
                              <strong style="color: #155724; font-size: 16px;">✓ Good News!</strong><br>
                              <span style="color: #155724; font-size: 14px; line-height: 1.6;">Your account will be automatically approved once you complete registration.</span>
                            </td>
                          </tr>
                        </table>
                        
                        ${preFilledData.firstName || preFilledData.lastName || preFilledData.userType ? `
                          <p style="margin: 20px 0 10px 0; font-size: 16px; line-height: 1.6; color: #374151;"><strong>Pre-filled Information:</strong></p>
                          <ul style="margin: 0 0 20px 0; padding-left: 25px; font-size: 14px; line-height: 1.8; color: #6b7280;">
                            ${preFilledData.firstName ? `<li>First Name: ${preFilledData.firstName}</li>` : ''}
                            ${preFilledData.lastName ? `<li>Last Name: ${preFilledData.lastName}</li>` : ''}
                            ${preFilledData.userType ? `<li>User Type: ${preFilledData.userType === 'student' ? 'Student' : 'Staff/Faculty'}</li>` : ''}
                          </ul>
                        ` : ''}
                        
                        <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">Click the button below to complete your registration. <strong style="color: #dc2626;">This link will expire in 7 days.</strong></p>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${invitationLink}" style="display: inline-block; padding: 14px 32px; background-color: #1a5d1a; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">Complete Registration</a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #6c757d; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef;">
                        <strong style="color: #1a5d1a;">Please do not reply to this email.</strong><br><br>
                        This is an automated message from <strong style="color: #1a5d1a;">S-CORE</strong><br>
                        Strategic Communications Office<br>
                        De La Salle University - Dasmariñas
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      if (this.resend) {
        const result = await this.resend.emails.send({
          from: `S-CORE - No Reply <${process.env.SMTP_FROM_EMAIL}>`,
          reply_to: 'sco@dlsud.edu.ph',
          to: userEmail,
          subject: 'You\'re Invited to Join S-CORE',
          html
        });
        console.log(`[EMAIL] ✅ Invitation sent to ${userEmail}`);
        return { success: true, id: result.id };
      } else {
        console.log(`[EMAIL] [DEV MODE] Invitation would be sent to ${userEmail}`);
        console.log(`[EMAIL] Invitation link: ${invitationLink}`);
        return { success: true, devMode: true, invitationLink };
      }
    } catch (error) {
      console.error('[EMAIL] ❌ Error sending invitation:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   * @param {string} testEmail - Email to send test to
   * @returns {Promise} Test result
   */
  async testEmailConfiguration(testEmail) {
    try {
      if (!this.resend) {
        return { success: false, message: 'Email service not configured' };
      }

      const result = await this.resend.emails.send({
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to: testEmail,
        subject: 'S-CORE Email Service Test',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif;">
              <h2>S-CORE Email Service Test</h2>
              <p>This is a test email to verify your email configuration is working correctly.</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p>If you received this email, your email service is configured properly!</p>
            </body>
          </html>
        `
      });

      console.log('[EMAIL] Test email sent successfully');
      return { success: true, id: result.id };
    } catch (error) {
      console.error('[EMAIL] Test email failed:', error);
      return { success: false, message: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();




