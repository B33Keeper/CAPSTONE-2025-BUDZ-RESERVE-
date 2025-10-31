import { EquipmentRentalItem } from './equipment-rental-item.entity';
export declare class EquipmentRental {
    id: number;
    reservation_id: number;
    user_id: number;
    total_amount: number;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    items: EquipmentRentalItem[];
}
