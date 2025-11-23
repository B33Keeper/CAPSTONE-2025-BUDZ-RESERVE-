import { TimeSlotsService } from './time-slots.service';
export declare class TimeSlotsController {
    private readonly timeSlotsService;
    constructor(timeSlotsService: TimeSlotsService);
    findAll(): Promise<import("./entities/time-slot.entity").TimeSlot[]>;
}
