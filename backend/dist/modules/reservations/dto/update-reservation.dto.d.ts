import { CreateReservationDto } from './create-reservation.dto';
import { ReservationStatus } from '../entities/reservation.entity';
declare const UpdateReservationDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateReservationDto>>;
export declare class UpdateReservationDto extends UpdateReservationDto_base {
    Status?: ReservationStatus;
    Paymongo_Reference_Number?: string;
}
export {};
