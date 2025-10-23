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
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_entity_1 = require("./entities/reservation.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const courts_service_1 = require("../courts/courts.service");
const equipment_service_1 = require("../equipment/equipment.service");
const paymongo_service_1 = require("../payments/paymongo.service");
let ReservationsService = class ReservationsService {
    constructor(reservationsRepository, paymentRepository, courtsService, equipmentService, payMongoService) {
        this.reservationsRepository = reservationsRepository;
        this.paymentRepository = paymentRepository;
        this.courtsService = courtsService;
        this.equipmentService = equipmentService;
        this.payMongoService = payMongoService;
    }
    async create(createReservationDto, userId) {
        const court = await this.courtsService.findOne(createReservationDto.Court_ID);
        if (court.Status !== 'Available') {
            throw new common_1.BadRequestException('Court is not available for reservation');
        }
        const existingReservation = await this.reservationsRepository.findOne({
            where: {
                Court_ID: createReservationDto.Court_ID,
                Reservation_Date: new Date(createReservationDto.Reservation_Date),
                Status: reservation_entity_1.ReservationStatus.CONFIRMED,
                Start_Time: (0, typeorm_2.Between)(createReservationDto.Start_Time, createReservationDto.End_Time),
            },
        });
        if (existingReservation) {
            throw new common_1.BadRequestException('Time slot is already reserved');
        }
        let totalAmount = court.Price;
        if (createReservationDto.equipment && createReservationDto.equipment.length > 0) {
            for (const item of createReservationDto.equipment) {
                const equipment = await this.equipmentService.findOne(item.equipment_id);
                totalAmount += equipment.price * item.quantity;
            }
        }
        const referenceNumber = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const reservation = this.reservationsRepository.create({
            ...createReservationDto,
            User_ID: userId,
            Total_Amount: totalAmount,
            Reference_Number: referenceNumber,
        });
        return this.reservationsRepository.save(reservation);
    }
    async findAll() {
        return this.reservationsRepository.find({
            relations: ['user', 'court'],
            order: { Created_at: 'DESC' },
        });
    }
    async findByUser(userId) {
        return this.reservationsRepository.find({
            where: { User_ID: userId },
            relations: ['court', 'payments'],
            order: { Created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const reservation = await this.reservationsRepository.findOne({
            where: { Reservation_ID: id },
            relations: ['user', 'court'],
        });
        if (!reservation) {
            throw new common_1.NotFoundException(`Reservation with ID ${id} not found`);
        }
        return reservation;
    }
    async update(id, updateReservationDto) {
        const reservation = await this.findOne(id);
        await this.reservationsRepository.update(id, updateReservationDto);
        return this.findOne(id);
    }
    async remove(id) {
        const reservation = await this.findOne(id);
        await this.reservationsRepository.remove(reservation);
    }
    async getAvailability(courtId, date) {
        const reservations = await this.reservationsRepository.find({
            where: {
                Court_ID: courtId,
                Reservation_Date: new Date(date),
                Status: reservation_entity_1.ReservationStatus.CONFIRMED,
            },
            select: ['Start_Time', 'End_Time'],
        });
        const timeSlots = [];
        for (let hour = 8; hour < 23; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
            const isReserved = reservations.some(res => res.Start_Time <= startTime && res.End_Time > startTime);
            timeSlots.push({
                start_time: startTime,
                end_time: endTime,
                available: !isReserved,
            });
        }
        return timeSlots;
    }
    async createFromPayment(paymentData) {
        try {
            const { bookingData, paymentId, amount, paymentMethod } = paymentData;
            console.log('=== CREATE FROM PAYMENT DEBUG ===');
            console.log('Payment Data received:', { paymentId, amount, paymentMethod });
            console.log('Payment ID type:', typeof paymentId);
            console.log('Payment ID starts with cs_:', paymentId?.startsWith?.('cs_'));
            const reservations = [];
            let actualPaymentMethod = 'gcash';
            try {
                console.log('Processing checkout session ID:', paymentId);
                if (paymentId.startsWith('cs_')) {
                    console.log('Detected checkout session, fetching session details...');
                    const checkoutSession = await this.payMongoService.getCheckoutSession(paymentId);
                    console.log('Checkout session details:', checkoutSession.attributes);
                    const payments = checkoutSession.attributes.payments;
                    if (payments && payments.length > 0) {
                        const paymentIdFromSession = payments[0].id;
                        console.log('Found payment ID from session:', paymentIdFromSession);
                        const payment = await this.payMongoService.getPayment(paymentIdFromSession);
                        console.log('Payment details:', payment.attributes);
                        const paymentMethodId = payment.attributes.source?.id;
                        if (paymentMethodId) {
                            console.log('Found payment method ID from payment:', paymentMethodId);
                            const paymentMethodDetails = await this.payMongoService.getPaymentMethod(paymentMethodId);
                            actualPaymentMethod = paymentMethodDetails.attributes.type;
                            console.log('Fetched payment method from Paymongo:', actualPaymentMethod);
                        }
                        else {
                            console.log('No payment method ID found in payment source');
                        }
                    }
                    else {
                        console.log('No payments found in checkout session');
                    }
                }
                else {
                    console.log('Not a checkout session ID, using default payment method');
                }
            }
            catch (error) {
                console.error('Error fetching payment method from Paymongo:', error);
                actualPaymentMethod = 'gcash';
            }
            for (const courtBooking of bookingData.courtBookings || []) {
                const courts = await this.courtsService.findAll();
                const court = courts.find(c => c.Court_Name === courtBooking.court);
                if (!court) {
                    throw new common_1.BadRequestException(`Court "${courtBooking.court}" not found`);
                }
                const [startTime, endTime] = this.parseScheduleToTimes(courtBooking.schedule);
                let actualPaymentId = paymentId;
                if (paymentId.startsWith('cs_')) {
                    actualPaymentId = paymentId;
                }
                const reservation = this.reservationsRepository.create({
                    User_ID: bookingData.userId,
                    Court_ID: court.Court_Id,
                    Reservation_Date: new Date(bookingData.selectedDate),
                    Start_Time: startTime,
                    End_Time: endTime,
                    Total_Amount: courtBooking.subtotal,
                    Reference_Number: bookingData.referenceNumber || `REF${Date.now()}`,
                    Paymongo_Reference_Number: actualPaymentId,
                    Notes: `Payment via Paymongo - ${actualPaymentId}`,
                    Status: reservation_entity_1.ReservationStatus.CONFIRMED,
                });
                const savedReservation = await this.reservationsRepository.save(reservation);
                reservations.push(savedReservation);
                await this.createPaymentRecord(savedReservation, actualPaymentId, amount, bookingData, actualPaymentMethod);
            }
            return reservations;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to create reservations from payment: ${error.message}`);
        }
    }
    parseScheduleToTimes(schedule) {
        const timeMatch = schedule.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!timeMatch) {
            return ['09:00:00', '10:00:00'];
        }
        const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch;
        const startTime = this.convertTo24Hour(parseInt(startHour), startPeriod, parseInt(startMin));
        const endTime = this.convertTo24Hour(parseInt(endHour), endPeriod, parseInt(endMin));
        return [startTime, endTime];
    }
    convertTo24Hour(hour, period, minute) {
        if (period.toUpperCase() === 'PM' && hour !== 12) {
            hour += 12;
        }
        else if (period.toUpperCase() === 'AM' && hour === 12) {
            hour = 0;
        }
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    }
    async createPaymentRecord(reservation, paymentId, amount, bookingData, paymentMethod) {
        try {
            const mappedPaymentMethod = this.mapPaymentMethod(paymentMethod);
            const payment = this.paymentRepository.create({
                reservation_id: reservation.Reservation_ID,
                amount: amount,
                payment_method: mappedPaymentMethod,
                transaction_id: paymentId,
                reference_number: `REF${Date.now()}`,
                notes: `Payment via Paymongo - ${paymentId}`,
                status: payment_entity_1.PaymentStatus.COMPLETED,
            });
            const savedPayment = await this.paymentRepository.save(payment);
            console.log(`Created payment record ${savedPayment.id} for reservation ${reservation.Reservation_ID}`);
            return savedPayment;
        }
        catch (error) {
            console.error('Error creating payment record:', error);
            throw error;
        }
    }
    mapPaymentMethod(paymentMethod) {
        switch (paymentMethod?.toLowerCase()) {
            case 'gcash':
                return payment_entity_1.PaymentMethod.GCASH;
            case 'paymaya':
                return payment_entity_1.PaymentMethod.MAYA;
            case 'grab_pay':
                return payment_entity_1.PaymentMethod.GRABPAY;
            case 'card':
                return payment_entity_1.PaymentMethod.BANKING;
            default:
                return payment_entity_1.PaymentMethod.GCASH;
        }
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        courts_service_1.CourtsService,
        equipment_service_1.EquipmentService,
        paymongo_service_1.PayMongoService])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map