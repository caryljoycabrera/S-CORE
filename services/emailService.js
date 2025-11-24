// ===== Email Service =====
// This module handles email delivery for notifications, announcements, and system messages
// Integrates with SMTP server for sending emails with HTML templates

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class EmailService {
  constructor() {
    this.transporter = null;
    this.emailQueue = [];
    this.isProcessing = false;
    this.initialize();
  }

  /**
   * Initialize the email transporter with SMTP configuration
   */
  initialize() {
    try {
      const smtpConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      };

      // Only initialize if SMTP credentials are provided
      if (smtpConfig.auth.user && smtpConfig.auth.pass) {
        this.transporter = nodemailer.createTransport(smtpConfig);
        console.log('[EMAIL] Email service initialized with SMTP configuration');
        
        // Verify connection
        this.transporter.verify((error, success) => {
          if (error) {
            console.error('[EMAIL] SMTP verification failed:', error);
          } else {
            console.log('[EMAIL] SMTP server is ready to send emails');
          }
        });
      } else {
        console.warn('[EMAIL] SMTP credentials not configured - email service in development mode');
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
      .header { background: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
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

      // If no SMTP transporter, log and return success (development mode)
      if (!this.transporter) {
        console.log(`[EMAIL] Development mode - would send email to: ${to}`);
        console.log(`[EMAIL] Subject: ${subject}`);
        console.log(`[EMAIL] Template: ${template}`);
        return { success: true, message: 'Development mode - email not sent' };
      }

      // Load template
      const html = this.loadTemplate(template, data);

      // Send email
      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        to: to,
        subject: subject,
        html: html
      });

      console.log(`[EMAIL] Email sent successfully to ${to}`);
      return { success: true, messageId: result.messageId };
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
   * Test email configuration
   * @param {string} testEmail - Email to send test to
   * @returns {Promise} Test result
   */
  async testEmailConfiguration(testEmail) {
    try {
      if (!this.transporter) {
        return { success: false, message: 'Email service not configured' };
      }

      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
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
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('[EMAIL] Test email failed:', error);
      return { success: false, message: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
