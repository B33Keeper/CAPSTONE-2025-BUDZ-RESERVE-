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
      
      // Log the from email being used (important for debugging sender verification)
      this.logger.log(`📧 Sending email from: ${fromEmail} to: ${to}`);

      const msg = {
        to,
        from: fromEmail,
        subject: 'Password Reset OTP - Budz Badminton',
        html,
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
}

