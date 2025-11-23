"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const bcrypt = __importStar(require("bcryptjs"));
const reservation_entity_1 = require("./entities/reservation.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const equipment_rental_entity_1 = require("../payments/entities/equipment-rental.entity");
const equipment_rental_item_entity_1 = require("../payments/entities/equipment-rental-item.entity");
const equipment_entity_1 = require("../equipment/entities/equipment.entity");
const user_entity_1 = require("../users/entities/user.entity");
const courts_service_1 = require("../courts/courts.service");
const equipment_service_1 = require("../equipment/equipment.service");
const paymongo_service_1 = require("../payments/paymongo.service");
let ReservationsService = class ReservationsService {
    constructor(reservationsRepository, paymentRepository, equipmentRentalRepository, equipmentRentalItemRepository, equipmentRepository, userRepository, courtsService, equipmentService, payMongoService) {
        this.reservationsRepository = reservationsRepository;
        this.paymentRepository = paymentRepository;
        this.equipmentRentalRepository = equipmentRentalRepository;
        this.equipmentRentalItemRepository = equipmentRentalItemRepository;
        this.equipmentRepository = equipmentRepository;
        this.userRepository = userRepository;
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
            Is_Admin_Created: false,
        });
        return this.reservationsRepository.save(reservation);
    }
    async getEquipmentAvailabilityByDate(dateInput, startTime, hoursParam) {
        if (!dateInput) {
            throw new common_1.BadRequestException('Date parameter is required to fetch equipment availability.');
        }
        const reservationDate = this.formatDateOnly(dateInput);
        const equipmentList = await this.equipmentRepository.find({ order: { equipment_name: 'ASC' } });
        const targetStartTime = startTime && /^\d{2}:\d{2}(:\d{2})?$/.test(startTime) ? this.ensureTimeFormat(startTime) : null;
        const targetHours = hoursParam && hoursParam > 0 ? hoursParam : null;
        const availability = [];
        for (const equipment of equipmentList) {
            let reserved = 0;
            if (targetStartTime && targetHours) {
                reserved = await this.getReservedQuantityForRange(equipment.id, reservationDate, targetStartTime, targetHours);
            }
            else {
                reserved = await this.getReservedQuantityForRange(equipment.id, reservationDate, null, null);
            }
            const available = Math.max(equipment.stocks - reserved, 0);
            availability.push({
                id: equipment.id,
                equipment_name: equipment.equipment_name,
                image_path: equipment.image_path,
                price: Number(equipment.price),
                total_stocks: equipment.stocks,
                reserved,
                available,
                status: available > 0 ? 'Available' : 'Unavailable',
            });
        }
        return availability;
    }
    async findAll() {
        return this.reservationsRepository.find({
            relations: ['user', 'court'],
            order: { Created_at: 'DESC' },
        });
    }
    async findByUser(userId) {
        return this.reservationsRepository.find({
            where: { User_ID: userId, Is_Admin_Created: false },
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
            const sortedCourtBookings = Array.isArray(bookingData.courtBookings)
                ? [...bookingData.courtBookings].sort((a, b) => this.compareScheduleStartTimes(a?.schedule ?? '', b?.schedule ?? ''))
                : [];
            const fallbackEquipmentStart = bookingData.equipmentStartTime ||
                this.getEarliestStartTimeFromBookings(sortedCourtBookings) ||
                this.getEarliestStartTimeFromBookings(bookingData.courtBookings || []);
            if (bookingData.equipmentBookings?.length) {
                await this.ensureEquipmentAvailabilityForDate(bookingData.selectedDate, bookingData.equipmentBookings, fallbackEquipmentStart);
            }
            for (const courtBooking of sortedCourtBookings) {
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
                    Is_Admin_Created: false,
                });
                const savedReservation = await this.reservationsRepository.save(reservation);
                reservations.push(savedReservation);
                await this.createPaymentRecord(savedReservation, actualPaymentId, amount, bookingData, actualPaymentMethod);
                if (bookingData.equipmentBookings?.length) {
                    await this.createEquipmentRentalsFromBooking(bookingData.userId, savedReservation, bookingData.equipmentBookings, fallbackEquipmentStart);
                }
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
            case 'cash':
                return payment_entity_1.PaymentMethod.CASH;
            case 'qrph':
            case 'qr_ph':
            case 'qr_philippines':
                return payment_entity_1.PaymentMethod.QRPH;
            default:
                return payment_entity_1.PaymentMethod.GCASH;
        }
    }
    async checkDuplicateReservation(userId, courtId, date, startTime, endTime) {
        try {
            const reservationDate = new Date(date);
            reservationDate.setHours(0, 0, 0, 0);
            const existingReservation = await this.reservationsRepository.findOne({
                where: {
                    User_ID: userId,
                    Court_ID: courtId,
                    Reservation_Date: reservationDate,
                    Start_Time: startTime,
                    End_Time: endTime,
                    Status: reservation_entity_1.ReservationStatus.CONFIRMED,
                },
            });
            if (existingReservation) {
                return {
                    isDuplicate: true,
                    message: 'You have already booked this court for the same date and time.',
                };
            }
            return { isDuplicate: false };
        }
        catch (error) {
            console.error('Error checking duplicate reservation:', error);
            return { isDuplicate: false };
        }
    }
    async getOrCreateGuestUser(customerName, customerEmail, customerContact) {
        const sanitizedName = customerName?.trim() || 'Walk-in Customer';
        const sanitizedEmail = customerEmail?.trim() || '';
        const sanitizedContact = customerContact?.trim() || '';
        let user = null;
        if (sanitizedEmail) {
            user = await this.userRepository.findOne({
                where: { email: sanitizedEmail },
            });
        }
        if (!user) {
            user = await this.userRepository.findOne({
                where: { name: (0, typeorm_2.Like)(`%${sanitizedName}%`) },
            });
        }
        if (user) {
            let requiresUpdate = false;
            if (sanitizedEmail &&
                sanitizedEmail !== user.email &&
                (!user.email || user.email.trim() === '' || user.email.endsWith('@walkin.local'))) {
                user.email = sanitizedEmail;
                requiresUpdate = true;
            }
            if (sanitizedContact && sanitizedContact !== (user.contact_number || '')) {
                user.contact_number = sanitizedContact;
                requiresUpdate = true;
            }
            if (requiresUpdate) {
                user = await this.userRepository.save(user);
            }
            return user;
        }
        const username = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        let emailForUser = sanitizedEmail;
        if (emailForUser) {
            const existingWithEmail = await this.userRepository.findOne({
                where: { email: emailForUser },
            });
            if (existingWithEmail) {
                emailForUser = '';
            }
        }
        if (!emailForUser) {
            emailForUser = `${username}@walkin.local`;
        }
        const randomPassword = `Guest${Date.now()}${Math.random().toString(36).substr(2, 9)}!@#`;
        const hashedPassword = await bcrypt.hash(randomPassword, 12);
        const newUser = this.userRepository.create({
            name: sanitizedName,
            username,
            email: emailForUser,
            password: hashedPassword,
            role: 'user',
            is_active: true,
            is_verified: false,
            ...(sanitizedContact ? { contact_number: sanitizedContact } : {}),
        });
        return this.userRepository.save(newUser);
    }
    async createWithCashPayment(customerName, bookingData, customerContact, customerEmail) {
        try {
            const sanitizedName = customerName?.trim() || 'Walk-in Customer';
            const sanitizedContact = customerContact?.trim();
            const sanitizedEmail = customerEmail?.trim();
            const { reservations, totalAmount, referenceNumber } = await this.createWalkInReservationsAndRentals(sanitizedName, bookingData, 'Payment via Cash', sanitizedContact, sanitizedEmail);
            if (!reservations.length) {
                throw new common_1.BadRequestException('No reservations were created for this booking.');
            }
            const customerDetailsNote = this.buildCustomerDetailsNote(sanitizedName, sanitizedContact, sanitizedEmail);
            const payment = this.paymentRepository.create({
                reservation_id: reservations[0].Reservation_ID,
                amount: totalAmount,
                payment_method: payment_entity_1.PaymentMethod.CASH,
                transaction_id: `CASH${Date.now()}${Math.floor(Math.random() * 1000)}`,
                reference_number: referenceNumber || reservations[0].Reference_Number,
                notes: `Payment received in cash - ${customerDetailsNote}`,
                status: payment_entity_1.PaymentStatus.COMPLETED,
            });
            const savedPayment = await this.paymentRepository.save(payment);
            return { reservations, payment: savedPayment };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to create reservation with cash payment: ${error.message}`);
        }
    }
    async generateQrPhPreview(customerName, qrDetails) {
        try {
            const sanitizedName = customerName?.trim() || 'Walk-in Customer';
            const effectiveNotes = qrDetails?.notes?.trim() || `Reservation - ${sanitizedName}`;
            const qrData = await this.payMongoService.generateQrPhStaticCode({
                mobileNumber: qrDetails?.mobileNumber,
                notes: effectiveNotes,
                kind: qrDetails?.kind || 'instore',
            });
            return { qrData };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to generate QR Ph code preview: ${error.message}`);
        }
    }
    async createWithQrPhPayment(customerName, bookingData, customerContact, customerEmail, qrDetails, existingQrData) {
        try {
            const sanitizedName = customerName?.trim() || 'Walk-in Customer';
            const sanitizedContact = customerContact?.trim();
            const sanitizedEmail = customerEmail?.trim();
            const { reservations, totalAmount, referenceNumber } = await this.createWalkInReservationsAndRentals(sanitizedName, bookingData, 'Payment via PayMongo QR Ph', sanitizedContact, sanitizedEmail);
            if (!reservations.length) {
                throw new common_1.BadRequestException('No reservations were created for this booking.');
            }
            const effectiveNotes = qrDetails?.notes ||
                existingQrData?.attributes?.notes ||
                `Reservation ${referenceNumber || reservations[0].Reference_Number} - ${sanitizedName}`;
            const qrData = existingQrData && existingQrData.id
                ? existingQrData
                : await this.payMongoService.generateQrPhStaticCode({
                    mobileNumber: qrDetails?.mobileNumber,
                    notes: effectiveNotes,
                    kind: qrDetails?.kind || existingQrData?.attributes?.kind || 'instore',
                });
            const customerDetailsNote = this.buildCustomerDetailsNote(sanitizedName, sanitizedContact, sanitizedEmail);
            const payment = this.paymentRepository.create({
                reservation_id: reservations[0].Reservation_ID,
                amount: totalAmount,
                payment_method: payment_entity_1.PaymentMethod.QRPH,
                transaction_id: qrData.id,
                reference_number: referenceNumber || reservations[0].Reference_Number,
                notes: `Pay via QR Ph code generated (${qrData.id}). ${qrData.attributes.notes ? `Notes: ${qrData.attributes.notes}. ` : ''}${customerDetailsNote}`,
                status: payment_entity_1.PaymentStatus.PENDING,
            });
            const savedPayment = await this.paymentRepository.save(payment);
            return { reservations, payment: savedPayment, qrData };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to create reservation with QR Ph payment: ${error.message}`);
        }
    }
    async createWalkInReservationsAndRentals(customerName, bookingData, reservationNotePrefix, customerContact, customerEmail) {
        const bookingCustomerDetails = bookingData?.customerDetails ?? {};
        const bookingContact = typeof bookingCustomerDetails?.contactNumber === 'string'
            ? bookingCustomerDetails.contactNumber
            : typeof bookingCustomerDetails?.contact === 'string'
                ? bookingCustomerDetails.contact
                : typeof bookingCustomerDetails?.phone === 'string'
                    ? bookingCustomerDetails.phone
                    : '';
        const bookingEmail = typeof bookingCustomerDetails?.email === 'string'
            ? bookingCustomerDetails.email
            : typeof bookingCustomerDetails?.emailAddress === 'string'
                ? bookingCustomerDetails.emailAddress
                : '';
        const effectiveContact = (customerContact ?? bookingContact)?.trim() || undefined;
        const effectiveEmail = (customerEmail ?? bookingEmail)?.trim() || undefined;
        const user = await this.getOrCreateGuestUser(customerName, effectiveEmail, effectiveContact);
        const userId = user.id;
        const { selectedDate, courtBookings, equipmentBookings, referenceNumber, equipmentStartTime } = bookingData;
        const reservations = [];
        let totalAmount = 0;
        const sortedCourtBookings = Array.isArray(courtBookings)
            ? [...courtBookings].sort((a, b) => this.compareScheduleStartTimes(a?.schedule ?? '', b?.schedule ?? ''))
            : [];
        if (!sortedCourtBookings.length) {
            throw new common_1.BadRequestException('At least one court booking is required to create a reservation.');
        }
        const customerDetailsNote = this.buildCustomerDetailsNote(customerName, effectiveContact, effectiveEmail);
        const fallbackEquipmentStart = equipmentStartTime ||
            this.getEarliestStartTimeFromBookings(sortedCourtBookings) ||
            this.getEarliestStartTimeFromBookings(courtBookings || []);
        if (equipmentBookings && equipmentBookings.length > 0) {
            await this.ensureEquipmentAvailabilityForDate(selectedDate, equipmentBookings, fallbackEquipmentStart);
        }
        let equipmentHandled = false;
        let effectiveReferenceNumber = referenceNumber || '';
        for (const courtBooking of sortedCourtBookings) {
            const courts = await this.courtsService.findAll();
            const court = courts.find((c) => c.Court_Name === courtBooking.court);
            if (!court) {
                throw new common_1.BadRequestException(`Court "${courtBooking.court}" not found`);
            }
            const [startTime, endTime] = this.parseScheduleToTimes(courtBooking.schedule);
            const reservation = this.reservationsRepository.create({
                User_ID: userId,
                Court_ID: court.Court_Id,
                Reservation_Date: new Date(selectedDate),
                Start_Time: startTime,
                End_Time: endTime,
                Total_Amount: courtBooking.subtotal,
                Reference_Number: referenceNumber || `REF${Date.now()}`,
                Notes: `${reservationNotePrefix} - ${customerDetailsNote}`,
                Status: reservation_entity_1.ReservationStatus.CONFIRMED,
                Is_Admin_Created: true,
            });
            const savedReservation = await this.reservationsRepository.save(reservation);
            reservations.push(savedReservation);
            totalAmount += Number(courtBooking.subtotal || 0);
            if (!effectiveReferenceNumber) {
                effectiveReferenceNumber = savedReservation.Reference_Number;
            }
            if (!equipmentHandled && equipmentBookings && equipmentBookings.length > 0) {
                await this.createEquipmentRentalsFromBooking(userId, savedReservation, equipmentBookings, fallbackEquipmentStart);
                equipmentHandled = true;
                const equipmentTotal = equipmentBookings.reduce((sum, b) => sum + Number(b.subtotal || 0), 0);
                totalAmount += equipmentTotal;
            }
        }
        return {
            reservations,
            totalAmount,
            referenceNumber: effectiveReferenceNumber || referenceNumber || reservations[0].Reference_Number,
        };
    }
    buildCustomerDetailsNote(customerName, customerContact, customerEmail) {
        const details = [`Walk-in customer: ${customerName}`];
        const trimmedContact = customerContact?.trim();
        const trimmedEmail = customerEmail?.trim();
        if (trimmedContact) {
            details.push(`Contact: ${trimmedContact}`);
        }
        if (trimmedEmail) {
            details.push(`Email: ${trimmedEmail}`);
        }
        return details.join(' | ');
    }
    formatDateOnly(dateInput) {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
        if (isNaN(date.getTime())) {
            throw new common_1.BadRequestException('Invalid reservation date for equipment availability.');
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    async getReservedQuantityForRange(equipmentId, reservationDate, startTime, hours, excludeReservationId) {
        const query = this.equipmentRentalItemRepository
            .createQueryBuilder('item')
            .innerJoin(equipment_rental_entity_1.EquipmentRental, 'rental', 'rental.id = item.rental_id')
            .innerJoin(reservation_entity_1.Reservation, 'reservation', 'reservation.Reservation_ID = rental.reservation_id')
            .where('item.equipment_id = :equipmentId', { equipmentId })
            .andWhere('reservation.Reservation_Date = :reservationDate', { reservationDate })
            .andWhere('reservation.Status IN (:...statuses)', {
            statuses: [reservation_entity_1.ReservationStatus.CONFIRMED, reservation_entity_1.ReservationStatus.PENDING, reservation_entity_1.ReservationStatus.COMPLETED],
        });
        if (excludeReservationId) {
            query.andWhere('reservation.Reservation_ID != :excludeReservationId', { excludeReservationId });
        }
        const rows = await query
            .select([
            'item.quantity AS item_quantity',
            'item.hours AS item_hours',
            'reservation.Start_Time AS reservation_start',
        ])
            .getRawMany();
        if (!startTime || !hours) {
            return rows.reduce((sum, row) => sum + Number(row.item_quantity ?? 0), 0);
        }
        const targetStart = this.timeStringToMinutes(startTime);
        const targetEnd = targetStart + hours * 60;
        return rows.reduce((sum, row) => {
            const existingStart = this.timeStringToMinutes(row.reservation_start);
            const existingHours = Number(row.item_hours ?? 0);
            const existingEnd = existingStart + existingHours * 60;
            return this.timeRangesOverlap(targetStart, targetEnd, existingStart, existingEnd)
                ? sum + Number(row.item_quantity ?? 0)
                : sum;
        }, 0);
    }
    async ensureEquipmentAvailabilityForDate(dateInput, equipmentBookings, defaultStartTime, excludeReservationId) {
        if (!equipmentBookings || equipmentBookings.length === 0)
            return;
        const reservationDate = this.formatDateOnly(dateInput);
        const normalizedDefaultStart = defaultStartTime ? this.ensureTimeFormat(defaultStartTime) : null;
        const uniqueNames = Array.from(new Set(equipmentBookings
            .map((booking) => booking.equipment)
            .filter((name) => Boolean(name && name.trim().length > 0))));
        const equipmentRows = uniqueNames.length > 0
            ? await this.equipmentRepository.find({
                where: uniqueNames.map((name) => ({ equipment_name: (0, typeorm_2.Like)(`%${name}%`) })),
            })
            : [];
        for (const booking of equipmentBookings) {
            const quantity = booking.quantity && booking.quantity > 0 ? booking.quantity : 1;
            let equipmentRow = equipmentRows.find((row) => row.equipment_name.toLowerCase() === booking.equipment.toLowerCase()) ??
                equipmentRows.find((row) => row.equipment_name.toLowerCase().includes(booking.equipment.toLowerCase()));
            if (!equipmentRow) {
                const fallbackRow = await this.equipmentRepository.findOne({ where: { equipment_name: booking.equipment } });
                if (fallbackRow) {
                    equipmentRow = fallbackRow;
                }
            }
            if (!equipmentRow) {
                throw new common_1.BadRequestException(`Equipment "${booking.equipment}" not found.`);
            }
            const bookingHours = this.parseHours(booking.time);
            const bookingStartTime = this.ensureTimeFormat(booking.startTime ?? normalizedDefaultStart);
            if (!bookingStartTime) {
                throw new common_1.BadRequestException(`Missing start time for equipment rental of ${equipmentRow.equipment_name}. Please select a court schedule first.`);
            }
            const reservedQuantity = await this.getReservedQuantityForRange(equipmentRow.id, reservationDate, bookingStartTime, bookingHours, excludeReservationId);
            const remaining = equipmentRow.stocks - reservedQuantity;
            if (remaining < quantity) {
                throw new common_1.BadRequestException(`Not enough stock for ${equipmentRow.equipment_name} on ${reservationDate} at ${bookingStartTime}. ` +
                    `Remaining: ${Math.max(remaining, 0)}`);
            }
        }
    }
    async createEquipmentRentalsFromBooking(userId, reservation, equipmentBookings, defaultStartTime) {
        if (!reservation?.Reservation_ID || !userId || !equipmentBookings || equipmentBookings.length === 0)
            return;
        const normalizedDefaultStart = defaultStartTime ? this.ensureTimeFormat(defaultStartTime) : null;
        await this.ensureEquipmentAvailabilityForDate(reservation.Reservation_Date, equipmentBookings, normalizedDefaultStart, reservation.Reservation_ID);
        const rental = this.equipmentRentalRepository.create({
            reservation_id: reservation.Reservation_ID,
            user_id: userId,
            total_amount: 0,
        });
        const savedRental = await this.equipmentRentalRepository.save(rental);
        let total = 0;
        for (const b of equipmentBookings) {
            const hours = this.parseHours(b.time);
            const quantity = b.quantity && b.quantity > 0 ? b.quantity : 1;
            let equipmentRow = await this.equipmentRepository.findOne({ where: { equipment_name: (0, typeorm_2.Like)(`%${b.equipment}%`) } });
            if (!equipmentRow) {
                const fallbackRow = await this.equipmentRepository.findOne({ where: { equipment_name: b.equipment } });
                if (fallbackRow) {
                    equipmentRow = fallbackRow;
                }
            }
            if (equipmentRow) {
                const reservationDate = this.formatDateOnly(reservation.Reservation_Date);
                const bookingStartTime = this.ensureTimeFormat(b.startTime ?? normalizedDefaultStart);
                if (!bookingStartTime) {
                    throw new common_1.BadRequestException(`Missing start time for equipment rental of ${equipmentRow.equipment_name}. Please select a court schedule first.`);
                }
                const reservedQuantity = await this.getReservedQuantityForRange(equipmentRow.id, reservationDate, bookingStartTime, hours, reservation.Reservation_ID);
                const remaining = equipmentRow.stocks - reservedQuantity;
                if (remaining < quantity) {
                    throw new common_1.BadRequestException(`Not enough stock for ${equipmentRow.equipment_name} on ${reservationDate} at ${bookingStartTime}. ` +
                        `Remaining: ${Math.max(remaining, 0)}`);
                }
            }
            const hourlyPrice = equipmentRow ? Number(equipmentRow.price) : Number(((b.subtotal || 0) / Math.max(1, hours * quantity)).toFixed(2)) || 0;
            const subtotal = b.subtotal != null && b.subtotal > 0 ? Number(b.subtotal) : Number((hourlyPrice * hours * quantity).toFixed(2));
            const item = this.equipmentRentalItemRepository.create({
                rental_id: savedRental.id,
                equipment_id: equipmentRow ? equipmentRow.id : 0,
                quantity,
                hours,
                hourly_price: hourlyPrice,
                subtotal,
            });
            await this.equipmentRentalItemRepository.save(item);
            total += subtotal;
        }
        await this.equipmentRentalRepository.update(savedRental.id, { total_amount: Number(total.toFixed(2)) });
    }
    ensureTimeFormat(time) {
        if (!time)
            return null;
        const parts = time.split(':');
        if (parts.length === 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
        }
        if (parts.length === 3) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
        }
        return null;
    }
    timeStringToMinutes(time) {
        if (!time)
            return 0;
        const [hours = '0', minutes = '0'] = time.split(':');
        return Number(hours) * 60 + Number(minutes);
    }
    timeRangesOverlap(startA, endA, startB, endB) {
        return Math.max(startA, startB) < Math.min(endA, endB);
    }
    compareScheduleStartTimes(scheduleA, scheduleB) {
        const [startA] = this.parseScheduleToTimes(scheduleA);
        const [startB] = this.parseScheduleToTimes(scheduleB);
        return this.timeStringToMinutes(startA) - this.timeStringToMinutes(startB);
    }
    getEarliestStartTimeFromBookings(courtBookings) {
        if (!courtBookings || courtBookings.length === 0)
            return null;
        let earliest = null;
        for (const booking of courtBookings) {
            if (!booking?.schedule)
                continue;
            const [startTime] = this.parseScheduleToTimes(booking.schedule);
            if (!earliest || this.timeStringToMinutes(startTime) < this.timeStringToMinutes(earliest)) {
                earliest = startTime;
            }
        }
        return earliest;
    }
    parseHours(time) {
        const match = time.match(/(\d+)\s*(?:hr|hour|hours)/i);
        return match ? parseInt(match[1], 10) : 1;
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(2, (0, typeorm_1.InjectRepository)(equipment_rental_entity_1.EquipmentRental)),
    __param(3, (0, typeorm_1.InjectRepository)(equipment_rental_item_entity_1.EquipmentRentalItem)),
    __param(4, (0, typeorm_1.InjectRepository)(equipment_entity_1.Equipment)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        courts_service_1.CourtsService,
        equipment_service_1.EquipmentService,
        paymongo_service_1.PayMongoService])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map