export declare class EquipmentItemDto {
    equipment_id: number;
    quantity: number;
}
export declare class CreateReservationDto {
    Court_ID: number;
    Reservation_Date: string;
    Start_Time: string;
    End_Time: string;
    Notes?: string;
    equipment?: EquipmentItemDto[];
}
