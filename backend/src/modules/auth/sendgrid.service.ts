import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { compile } from 'handlebars';

// Use require for SendGrid to ensure proper module resolution
let sgMail: any;
try {
  sgMail = require('@sendgrid/mail');
} catch (error) {
  // Will be handled in constructor
}

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('SENDGRID_API_KEY');
    if (apiKey && sgMail) {
      try {
        // Handle different module export styles
        const mailModule = sgMail.default || sgMail;
        if (mailModule && typeof mailModule.setApiKey === 'function') {
          mailModule.setApiKey(apiKey);
          this.isInitialized = true;
          this.logger.log('✅ SendGrid API initialized');
        } else {
          this.logger.error('❌ SendGrid setApiKey method not found');
        }
      } catch (error) {
        this.logger.error('❌ Failed to initialize SendGrid:', error);
      }
    } else {
      if (!apiKey) {
        this.logger.warn('⚠️ SENDGRID_API_KEY not configured');
      }
      if (!sgMail) {
        this.logger.warn('⚠️ @sendgrid/mail package not found');
      }
    }
  }

  async sendOtpEmail(to: string, otp: string, name: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('SendGrid API key not configured');
    }

    try {
      // Read and compile the template
      const templatePath = path.join(
        process.cwd(),
        'src',
        'templates',
        'forgot-password.hbs',
      );
      
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template = compile(templateContent);
      
      // Render the template
      const html = template({
        otp,
        name: name || 'User',
      });

      const fromEmail = this.configService.get('SMTP_FROM', 'noreply@sendgrid.net');
      const fromName = this.configService.get('SMTP_FROM_NAME', 'Budz Badminton');
      const appUrl = this.configService.get('FRONTEND_URL', 'https://client-production-3363.up.railway.app/');
      
      // Log the from email being used (important for debugging sender verification)
      this.logger.log(`📧 Sending email from: ${fromName} <${fromEmail}> to: ${to}`);
      this.logger.log(`📧 Email configuration check: FROM="${fromEmail}" must match verified sender in SendGrid`);

      // Create email message with best practices for deliverability
      const msg = {
        to,
        from: {
          email: fromEmail,
          name: fromName, // Proper from name improves deliverability
        },
        replyTo: {
          email: fromEmail,
          name: fromName,
        },
        subject: 'Password Reset OTP - Budz Badminton',
        html,
        // Add text version for better deliverability
        text: `Hello ${name || 'User'},\n\nYou have requested to reset your password for your Budz Badminton account.\n\nYour OTP Code is: ${otp}\n\nThis OTP will expire in 15 minutes.\n\nIf you didn't request this password reset, please ignore this email.\n\n© 2024 Budz Badminton. All rights reserved.`,
        // Add headers to improve deliverability
        headers: {
          'List-Unsubscribe': `<${appUrl}/unsubscribe>`, // Helps with spam filtering
          'X-Entity-Ref-ID': `otp-${Date.now()}`, // Unique identifier for tracking
        },
        // Add categories for SendGrid tracking (helps with reputation)
        categories: ['password-reset', 'otp'],
        // Mail settings for better deliverability
        mailSettings: {
          clickTracking: {
            enable: false, // Disable click tracking for OTP emails (security)
          },
          openTracking: {
            enable: false, // Disable open tracking for OTP emails (privacy)
          },
        },
      };

      // Get the mail module (handle different export styles)
      const mailModule = sgMail.default || sgMail;
      
      if (!mailModule || typeof mailModule.send !== 'function') {
        throw new Error('SendGrid send method not available');
      }
      
      // Send email - SendGrid send() returns [response, body] or throws error
      try {
        const result = await mailModule.send(msg);
        
        // Handle response (result is [response, body] array)
        const response = Array.isArray(result) ? result[0] : result;
        const body = Array.isArray(result) ? result[1] : undefined;
        
        // Log success with detailed information
        this.logger.log(`✅ OTP email sent successfully to: ${to}`);
        if (response?.statusCode) {
          this.logger.log(`SendGrid response status: ${response.statusCode}`);
        }
        if (body) {
          this.logger.log(`SendGrid response body: ${JSON.stringify(body)}`);
        }
        
        // Check if status is 202 (Accepted) - this means SendGrid accepted it
        // But if sender isn't verified, SendGrid may accept but not deliver
        if (response?.statusCode === 202) {
          this.logger.log(`✅ Email accepted by SendGrid (status 202)`);
          this.logger.warn(`⚠️  IMPORTANT: Make sure "${fromEmail}" is verified in SendGrid Sender Authentication!`);
          this.logger.warn(`   If emails aren't arriving, check: 1) Spam folder, 2) Sender verification in SendGrid`);
        }
        
        return true;
      } catch (sendError: any) {
        // If send() throws, log and re-throw
        this.logger.error('SendGrid send() threw error:', sendError);
        throw sendError;
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to send OTP email to ${to}:`, error);
      this.logger.error('Error message:', error?.message);
      this.logger.error('Error code:', error?.code);
      if (error.response) {
        this.logger.error('SendGrid error details:', JSON.stringify(error.response.body, null, 2));
        this.logger.error('SendGrid status code:', error.response.statusCode);
      }
      // Re-throw with more context
      const errorMessage = error.response?.body?.errors?.[0]?.message || error.message || 'Failed to send email';
      throw new Error(`SendGrid error: ${errorMessage}`);
    }
  }

  /**
   * Generic method to send emails using any Handlebars template
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param templateName - Name of the template file (without .hbs extension)
   * @param context - Template context data
   * @returns Promise<boolean>
   */
  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: any,
  ): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('SendGrid API key not configured');
    }

    try {
      // Read and compile the template
      const templatePath = path.join(
        process.cwd(),
        'src',
        'templates',
        `${templateName}.hbs`,
      );
      
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template = compile(templateContent);
      
      // Render the template
      const html = template(context);

      const fromEmail = this.configService.get('SMTP_FROM', 'noreply@sendgrid.net');
      const fromName = this.configService.get('SMTP_FROM_NAME', 'Budz Badminton');
      const appUrl = this.configService.get('FRONTEND_URL', 'https://client-production-3363.up.railway.app/');
      
      // Log the from email being used
      this.logger.log(`📧 Sending email from: ${fromName} <${fromEmail}> to: ${to}`);
      this.logger.log(`📧 Template: ${templateName}, Subject: ${subject}`);

      // Create email message with best practices for deliverability
      const msg: any = {
        to,
        from: {
          email: fromEmail,
          name: fromName, // Proper from name improves deliverability
        },
        replyTo: {
          email: fromEmail,
          name: fromName,
        },
        subject,
        html,
        // Add headers to improve deliverability
        headers: {
          'List-Unsubscribe': `<${appUrl}/unsubscribe>`, // Helps with spam filtering
          'X-Entity-Ref-ID': `${templateName}-${Date.now()}`, // Unique identifier for tracking
        },
        // Add categories for SendGrid tracking (helps with reputation)
        categories: [templateName.replace('-', '_')],
        // Mail settings for better deliverability
        mailSettings: {
          clickTracking: {
            enable: true, // Enable for receipts (helps track engagement)
          },
          openTracking: {
            enable: true, // Enable for receipts (helps track engagement)
          },
        },
      };

      // Add text version if available in context (for better deliverability)
      if (context.textVersion) {
        msg.text = context.textVersion;
      }

      // Get the mail module (handle different export styles)
      const mailModule = sgMail.default || sgMail;
      
      if (!mailModule || typeof mailModule.send !== 'function') {
        throw new Error('SendGrid send method not available');
      }
      
      // Send email - SendGrid send() returns [response, body] or throws error
      try {
        const result = await mailModule.send(msg);
        
        // Handle response (result is [response, body] array)
        const response = Array.isArray(result) ? result[0] : result;
        const body = Array.isArray(result) ? result[1] : undefined;
        
        // Log success
        this.logger.log(`✅ Email sent successfully to: ${to}`);
        if (response?.statusCode) {
          this.logger.log(`SendGrid response status: ${response.statusCode}`);
        }
        
        return true;
      } catch (sendError: any) {
        // If send() throws, log and re-throw
        this.logger.error('SendGrid send() threw error:', sendError);
        throw sendError;
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to send email to ${to}:`, error);
      this.logger.error('Error message:', error?.message);
      this.logger.error('Error code:', error?.code);
      if (error.response) {
        this.logger.error('SendGrid error details:', JSON.stringify(error.response.body, null, 2));
        this.logger.error('SendGrid status code:', error.response.statusCode);
      }
      // Re-throw with more context
      const errorMessage = error.response?.body?.errors?.[0]?.message || error.message || 'Failed to send email';
      throw new Error(`SendGrid error: ${errorMessage}`);
    }
  }
}

