import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

interface PaymentReceiptData {
  paymentId: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  paidAt?: Date;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  paymentMethod: {
    type: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
  };
  fee: number;
  netAmount: number;
  referenceNumber?: string;
  reservationDetails?: {
    courtName: string;
    date: string;
    timeSlot: string;
    duration: number;
  };
}

@Injectable()
export class EmailReceiptService {
  private readonly logger = new Logger(EmailReceiptService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendPaymentReceipt(paymentData: PaymentReceiptData): Promise<boolean> {
    try {
      const {
        paymentId,
        amount,
        currency,
        description,
        status,
        paidAt,
        customerName,
        customerEmail,
        customerPhone,
        billingAddress,
        paymentMethod,
        fee,
        netAmount,
        referenceNumber,
        reservationDetails
      } = paymentData;

      // Format amount for display
      const formattedAmount = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: currency,
      }).format(amount / 100);

      const formattedFee = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: currency,
      }).format(fee / 100);

      const formattedNetAmount = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: currency,
      }).format(netAmount / 100);

      // Prepare email data
      const emailData = {
        paymentId,
        amount: formattedAmount,
        description,
        status: status.toUpperCase(),
        paidAt: paidAt ? new Date(paidAt).toLocaleString('en-PH', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) : 'N/A',
        customerName,
        customerEmail,
        customerPhone: customerPhone || 'N/A',
        billingAddress: {
          ...billingAddress,
          fullAddress: `${billingAddress.line1}${billingAddress.line2 ? ', ' + billingAddress.line2 : ''}, ${billingAddress.city}, ${billingAddress.state} ${billingAddress.postal_code}, ${billingAddress.country}`
        },
        paymentMethod: {
          ...paymentMethod,
          displayName: this.getPaymentMethodDisplayName(paymentMethod.type, paymentMethod.last4)
        },
        fee: formattedFee,
        netAmount: formattedNetAmount,
        referenceNumber: referenceNumber || paymentId,
        reservationDetails,
        appName: this.configService.get('APP_NAME', 'Budz Reserve'),
        appUrl: this.configService.get('FRONTEND_URL', 'http://localhost:3000'),
        supportEmail: this.configService.get('SUPPORT_EMAIL', 'support@budzreserve.com')
      };

      // Send email
      await this.mailerService.sendMail({
        to: customerEmail,
        subject: `Payment Receipt - ${emailData.referenceNumber}`,
        template: 'payment-receipt',
        context: emailData,
      });

      this.logger.log(`Payment receipt sent successfully to ${customerEmail} for payment ${paymentId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to send payment receipt for payment ${paymentData.paymentId}:`, error);
      return false;
    }
  }

  private getPaymentMethodDisplayName(type: string, last4?: string): string {
    switch (type) {
      case 'card':
        return `**** **** **** ${last4 || '****'}`;
      case 'gcash':
        return 'GCash';
      case 'paymaya':
        return 'PayMaya';
      case 'grab_pay':
        return 'GrabPay';
      default:
        return type.toUpperCase();
    }
  }

  async sendPaymentConfirmation(paymentData: PaymentReceiptData): Promise<boolean> {
    try {
      const {
        paymentId,
        amount,
        currency,
        customerName,
        customerEmail,
        referenceNumber,
        reservationDetails
      } = paymentData;

      const formattedAmount = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: currency,
      }).format(amount / 100);

      const emailData = {
        paymentId,
        amount: formattedAmount,
        customerName,
        customerEmail,
        referenceNumber: referenceNumber || paymentId,
        reservationDetails,
        appName: this.configService.get('APP_NAME', 'Budz Reserve'),
        appUrl: this.configService.get('FRONTEND_URL', 'http://localhost:3000'),
        supportEmail: this.configService.get('SUPPORT_EMAIL', 'support@budzreserve.com')
      };

      await this.mailerService.sendMail({
        to: customerEmail,
        subject: `Payment Confirmation - ${emailData.referenceNumber}`,
        template: 'payment-confirmation',
        context: emailData,
      });

      this.logger.log(`Payment confirmation sent successfully to ${customerEmail} for payment ${paymentId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to send payment confirmation for payment ${paymentData.paymentId}:`, error);
      return false;
    }
  }
}
