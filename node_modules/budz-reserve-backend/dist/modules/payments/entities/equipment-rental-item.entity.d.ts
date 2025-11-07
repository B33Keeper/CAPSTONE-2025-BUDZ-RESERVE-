import { EquipmentRental } from './equipment-rental.entity';
export declare class EquipmentRentalItem {
    id: number;
    rental_id: number;
    equipment_id: number;
    quantity: number;
    hours: number;
    hourly_price: number;
    subtotal: number;
    created_at: Date;
    rental: EquipmentRental;
}
