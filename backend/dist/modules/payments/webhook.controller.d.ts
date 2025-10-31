import { Repository } from 'typeorm';
import { PayMongoService } from './paymongo.service';
import { EmailReceiptService } from './email-receipt.service';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { EquipmentRental } from './entities/equipment-rental.entity';
import { EquipmentRentalItem } from './entities/equipment-rental-item.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { CourtsService } from '../courts/courts.service';
interface PaymongoWebhookEvent {
    data: {
        id: string;
        type: string;
        attributes: {
            type: string;
            livemode: boolean;
            data: {
                id: string;
                type: string;
                attributes: any;
            };
            created_at: number;
        };
    };
}
export declare class WebhookController {
    private readonly payMongoService;
    private readonly emailReceiptService;
    private readonly paymentsService;
    private readonly courtsService;
    private readonly reservationRepository;
    private readonly paymentRepository;
    private readonly rentalRepository;
    private readonly rentalItemRepository;
    private readonly equipmentRepository;
    private readonly logger;
    constructor(payMongoService: PayMongoService, emailReceiptService: EmailReceiptService, paymentsService: PaymentsService, courtsService: CourtsService, reservationRepository: Repository<Reservation>, paymentRepository: Repository<Payment>, rentalRepository: Repository<EquipmentRental>, rentalItemRepository: Repository<EquipmentRentalItem>, equipmentRepository: Repository<Equipment>);
    testWebhook(testData: any): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
    }>;
    handlePaymongoWebhook(body: PaymongoWebhookEvent, signature: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private handleCheckoutSessionPaid;
    private handlePaymentPaid;
    private parseHours;
    private createEquipmentRentalsFromBooking;
    private createReservationFromPayment;
    private handlePaymentFailed;
    private handlePaymentIntentSucceeded;
    private handlePaymentIntentFailed;
    private verifyWebhookSignature;
    private handleTestPayment;
    private createReservationFromTestData;
    private parseScheduleToTimes;
    private mapPaymentMethod;
}
export {};
