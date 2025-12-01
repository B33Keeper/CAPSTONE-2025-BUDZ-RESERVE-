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
      
      await mailModule.send(msg);
      this.logger.log(`✅ OTP email sent successfully to: ${to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send OTP email to ${to}:`, error);
      if (error.response) {
        this.logger.error('SendGrid error details:', error.response.body);
      }
      throw error;
    }
  }
}

