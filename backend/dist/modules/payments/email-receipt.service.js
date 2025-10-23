"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailReceiptService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailReceiptService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mailer_1 = require("@nestjs-modules/mailer");
let EmailReceiptService = EmailReceiptService_1 = class EmailReceiptService {
    constructor(mailerService, configService) {
        this.mailerService = mailerService;
        this.configService = configService;
        this.logger = new common_1.Logger(EmailReceiptService_1.name);
    }
    async sendPaymentReceipt(paymentData) {
        try {
            const { paymentId, amount, currency, description, status, paidAt, customerName, customerEmail, customerPhone, billingAddress, paymentMethod, fee, netAmount, referenceNumber, reservationDetails } = paymentData;
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
            await this.mailerService.sendMail({
                to: customerEmail,
                subject: `Payment Receipt - ${emailData.referenceNumber}`,
                template: 'payment-receipt',
                context: emailData,
            });
            this.logger.log(`Payment receipt sent successfully to ${customerEmail} for payment ${paymentId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send payment receipt for payment ${paymentData.paymentId}:`, error);
            return false;
        }
    }
    getPaymentMethodDisplayName(type, last4) {
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
    async sendPaymentConfirmation(paymentData) {
        try {
            const { paymentId, amount, currency, customerName, customerEmail, referenceNumber, reservationDetails } = paymentData;
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
        }
        catch (error) {
            this.logger.error(`Failed to send payment confirmation for payment ${paymentData.paymentId}:`, error);
            return false;
        }
    }
};
exports.EmailReceiptService = EmailReceiptService;
exports.EmailReceiptService = EmailReceiptService = EmailReceiptService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService,
        config_1.ConfigService])
], EmailReceiptService);
//# sourceMappingURL=email-receipt.service.js.map