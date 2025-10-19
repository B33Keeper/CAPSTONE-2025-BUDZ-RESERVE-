import { CourtStatus } from '../entities/court.entity';
export declare class CreateCourtDto {
    Court_Name: string;
    Status?: CourtStatus;
    Price?: number;
}
