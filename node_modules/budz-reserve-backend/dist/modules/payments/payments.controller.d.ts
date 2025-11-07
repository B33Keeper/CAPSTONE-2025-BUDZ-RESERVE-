import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(createPaymentDto: CreatePaymentDto): Promise<import("./entities/payment.entity").Payment>;
    findAll(): Promise<import("./entities/payment.entity").Payment[]>;
    getSalesReport(period?: string): Promise<{
        data: {
            reservationId: number;
            customerName: string;
            courtName: string;
            time: string;
            date: string;
            paymentMethod: import("./entities/payment.entity").PaymentMethod;
            price: number;
            status: string;
            equipmentRentals: any[];
        }[];
        summary: {
            totalReservations: number;
            totalIncome: number;
            totalCancellations: number;
        };
    }>;
    findOne(id: number): Promise<import("./entities/payment.entity").Payment>;
    updateStatus(id: number, status: string): Promise<import("./entities/payment.entity").Payment>;
}
