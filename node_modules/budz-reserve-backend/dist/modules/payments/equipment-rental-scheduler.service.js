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
var EquipmentRentalSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentRentalSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const equipment_rental_entity_1 = require("./entities/equipment-rental.entity");
const equipment_rental_item_entity_1 = require("./entities/equipment-rental-item.entity");
const equipment_entity_1 = require("../equipment/entities/equipment.entity");
const reservation_entity_1 = require("../reservations/entities/reservation.entity");
let EquipmentRentalSchedulerService = EquipmentRentalSchedulerService_1 = class EquipmentRentalSchedulerService {
    constructor(rentalItemRepository, rentalRepository, equipmentRepository, reservationRepository) {
        this.rentalItemRepository = rentalItemRepository;
        this.rentalRepository = rentalRepository;
        this.equipmentRepository = equipmentRepository;
        this.reservationRepository = reservationRepository;
        this.logger = new common_1.Logger(EquipmentRentalSchedulerService_1.name);
    }
    async handleExpiredRentalRestoration() {
        this.logger.log('Checking for expired equipment rentals...');
        try {
            const now = new Date();
            let restoredCount = 0;
            const rentalItems = await this.rentalItemRepository.find();
            for (const item of rentalItems) {
                const rental = await this.rentalRepository.findOne({
                    where: { id: item.rental_id },
                });
                if (!rental || !rental.reservation_id) {
                    continue;
                }
                const reservation = await this.reservationRepository.findOne({
                    where: { Reservation_ID: rental.reservation_id },
                });
                if (!reservation) {
                    continue;
                }
                let reservationDate;
                if (reservation.Reservation_Date instanceof Date) {
                    reservationDate = new Date(reservation.Reservation_Date);
                }
                else {
                    const dateStr = typeof reservation.Reservation_Date === 'string'
                        ? reservation.Reservation_Date
                        : String(reservation.Reservation_Date);
                    reservationDate = new Date(dateStr);
                }
                reservationDate.setHours(0, 0, 0, 0);
                const startTime = reservation.Start_Time;
                const hours = item.hours;
                const quantity = item.quantity;
                const equipmentId = item.equipment_id;
                const itemId = item.id;
                if (startTime) {
                    const timeParts = startTime.split(':');
                    const timeHours = parseInt(timeParts[0] || '0', 10);
                    const timeMinutes = parseInt(timeParts[1] || '0', 10);
                    reservationDate.setHours(timeHours, timeMinutes, 0, 0);
                }
                const expirationDate = new Date(reservationDate);
                expirationDate.setHours(expirationDate.getHours() + hours);
                if (expirationDate < now) {
                    if (!equipmentId || equipmentId === 0) {
                        this.logger.error(`Invalid equipment_id (${equipmentId}) for rental item ID ${itemId}. Skipping restoration.`);
                        await this.rentalItemRepository.delete(itemId);
                        continue;
                    }
                    const equipment = await this.equipmentRepository.findOne({
                        where: { id: equipmentId },
                    });
                    if (!equipment) {
                        this.logger.error(`Equipment with ID ${equipmentId} not found for rental item ID ${itemId}. Skipping restoration.`);
                        await this.rentalItemRepository.delete(itemId);
                        continue;
                    }
                    const previousStock = equipment.stocks;
                    const newStock = previousStock + quantity;
                    await this.equipmentRepository.update(equipment.id, {
                        stocks: newStock,
                    });
                    const updatedEquipment = await this.equipmentRepository.findOne({
                        where: { id: equipment.id },
                    });
                    if (updatedEquipment && updatedEquipment.stocks === newStock) {
                        this.logger.log(`Restored ${quantity} stock for ${equipment.equipment_name} (ID: ${equipment.id}). ` +
                            `Previous: ${previousStock}, New: ${newStock}, Verified: ${updatedEquipment.stocks} ` +
                            `(Rental Item ID: ${itemId}, Equipment ID from item: ${equipmentId}, Expired at: ${expirationDate.toISOString()})`);
                        restoredCount++;
                    }
                    else {
                        this.logger.error(`Failed to restore stock for ${equipment.equipment_name} (ID: ${equipment.id}). ` +
                            `Expected: ${newStock}, Actual: ${updatedEquipment?.stocks || 'unknown'} ` +
                            `(Rental Item ID: ${itemId}, Equipment ID from item: ${equipmentId})`);
                    }
                    await this.rentalItemRepository.delete(itemId);
                }
            }
            if (restoredCount > 0) {
                this.logger.log(`Restored stock for ${restoredCount} expired rental(s)`);
            }
            else {
                this.logger.debug('No expired rentals found');
            }
        }
        catch (error) {
            this.logger.error('Error during expired rental restoration:', error);
        }
    }
    async manualRestoreExpiredRentals() {
        this.logger.log('Manual expired rental restoration triggered...');
        await this.handleExpiredRentalRestoration();
        return {
            message: 'Expired rental restoration completed',
            restoredCount: 0,
        };
    }
};
exports.EquipmentRentalSchedulerService = EquipmentRentalSchedulerService;
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EquipmentRentalSchedulerService.prototype, "handleExpiredRentalRestoration", null);
exports.EquipmentRentalSchedulerService = EquipmentRentalSchedulerService = EquipmentRentalSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(equipment_rental_item_entity_1.EquipmentRentalItem)),
    __param(1, (0, typeorm_1.InjectRepository)(equipment_rental_entity_1.EquipmentRental)),
    __param(2, (0, typeorm_1.InjectRepository)(equipment_entity_1.Equipment)),
    __param(3, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EquipmentRentalSchedulerService);
//# sourceMappingURL=equipment-rental-scheduler.service.js.map