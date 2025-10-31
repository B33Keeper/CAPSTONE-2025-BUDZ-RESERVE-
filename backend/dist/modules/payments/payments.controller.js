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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const payments_service_1 = require("./payments.service");
const create_payment_dto_1 = require("./dto/create-payment.dto");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    create(createPaymentDto) {
        return this.paymentsService.create(createPaymentDto);
    }
    findAll() {
        return this.paymentsService.findAll();
    }
    async getSalesReport(period) {
        try {
            console.log('========================================');
            console.log('[SalesReport Controller] Endpoint called!');
            console.log(`[SalesReport Controller] Period received: ${period}`);
            console.log('========================================');
            const periodValue = period || 'daily';
            const now = new Date();
            let startDate;
            let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            switch (periodValue) {
                case 'daily':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                    break;
                case 'weekly':
                    const dayOfWeek = now.getDay();
                    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0);
                    break;
                case 'monthly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
                    break;
                case 'quarterly':
                    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
                    startDate = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0);
                    break;
                case 'yearly':
                    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            }
            console.log(`[SalesReport Controller] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
            const result = await this.paymentsService.getSalesReport(startDate, endDate);
            console.log(`[SalesReport Controller] Found ${result.data.length} records, summary:`, result.summary);
            return result;
        }
        catch (error) {
            console.error('[SalesReport Controller] ERROR:', error);
            console.error('[SalesReport Controller] Error stack:', error.stack);
            throw error;
        }
    }
    findOne(id) {
        return this.paymentsService.findOne(id);
    }
    updateStatus(id, status) {
        return this.paymentsService.updateStatus(id, status);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new payment' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payment created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all payments' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payments retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('sales-report'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get sales report' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sales report retrieved successfully' }),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getSalesReport", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Payment not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update payment status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment status updated successfully' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "updateStatus", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('payments'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map