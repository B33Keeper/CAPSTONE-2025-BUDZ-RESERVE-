export declare enum QueueingCourtStatus {
    AVAILABLE = "available",
    OCCUPIED = "occupied",
    MAINTENANCE = "maintenance",
    UNAVAILABLE = "unavailable"
}
export declare class QueueingCourt {
    id: number;
    name: string;
    status: QueueingCourtStatus;
    createdAt: Date;
    updatedAt: Date;
}
