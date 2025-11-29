# Reservation History Implementation

## Overview
This document describes the implementation of a separate reservation history database table system. All reservations that have ended are automatically transferred from the main `reservations` table to the `reservations_history` table to keep the database organized.

## What Was Implemented

### 1. Database Schema
- **New Entity**: `ReservationHistory` (`backend/src/modules/reservations/entities/reservation-history.entity.ts`)
- **New Migration**: `20250124_create_reservations_history.sql`
  - Creates `reservations_history` table with all reservation fields plus:
    - `History_ID`: Primary key
    - `original_id`: Reference to the original reservation ID
    - `Archived_at`: Timestamp when the reservation was moved to history

### 2. Service Methods
Added to `ReservationsService`:
- `isReservationEnded()`: Checks if a reservation has ended based on date and end time
- `moveReservationToHistory()`: Moves a single reservation to history table
- `getEndedReservations()`: Gets all confirmed reservations that have ended
- `moveEndedReservationsToHistory()`: Moves all ended reservations to history in batch
- `getUserReservationHistory()`: Gets reservation history for a specific user
- `getAllReservationHistory()`: Gets all reservation history (admin)
- `getReservationHistoryById()`: Gets a specific history record by ID

### 3. Automatic Scheduler
- **New Service**: `ReservationsSchedulerService` (`backend/src/modules/reservations/reservations-scheduler.service.ts`)
  - Runs daily at midnight (00:00)
  - Automatically moves all ended reservations to history
  - Can be manually triggered for testing

### 4. API Endpoints
New endpoints added to `ReservationsController`:
- `GET /reservations/history/my-reservations` - Get current user's reservation history
- `GET /reservations/history` - Get all reservation history (admin)
- `GET /reservations/history/:id` - Get specific reservation history by ID
- `POST /reservations/cleanup` - Manually trigger cleanup to move ended reservations

## How It Works

### Automatic Transfer
1. **Daily Cron Job**: Runs every day at midnight
2. **Detection**: Identifies all confirmed reservations where:
   - Reservation date + end time < current date/time
3. **Transfer**: Moves each ended reservation to the history table
4. **Cleanup**: Removes the original reservation from the main table

### Manual Transfer
- Admins can trigger manual cleanup via API endpoint
- Useful for testing or immediate cleanup needs

### Reservation End Detection
A reservation is considered "ended" when:
- Status is `CONFIRMED`
- Current date/time is past the reservation date + end time

Example:
- Reservation Date: `2025-01-20`
- End Time: `18:00:00`
- Current Time: `2025-01-20 18:30:00` → Reservation has ended

## Database Structure

### Main Reservations Table (`reservations`)
- Contains only active/upcoming reservations
- Clean and focused for current operations

### History Table (`reservations_history`)
- Contains all completed/ended reservations
- Includes `original_id` for reference tracking
- Includes `Archived_at` timestamp

## Migration Steps

1. **Run the migration**:
   ```bash
   # Apply the migration file
   mysql -u your_user -p your_database < backend/src/database/migrations/20250124_create_reservations_history.sql
   ```

2. **Restart the backend server**:
   The scheduler will automatically start running daily at midnight.

3. **Manual cleanup (optional)**:
   ```bash
   POST http://localhost:3001/api/reservations/cleanup
   ```

## Benefits

1. **Organization**: Main reservations table stays clean with only active reservations
2. **Performance**: Faster queries on active reservations
3. **History Preservation**: All past reservations are preserved in history
4. **Automatic**: No manual intervention needed
5. **Scalable**: Handles large numbers of reservations efficiently

## Testing

### Test 1: Check Ended Reservations
```bash
# Get all reservations
GET http://localhost:3001/api/reservations

# Check which ones have ended
# (Compare reservation date + end time with current time)
```

### Test 2: Manual Cleanup
```bash
POST http://localhost:3001/api/reservations/cleanup
```

### Test 3: View History
```bash
# Get your reservation history
GET http://localhost:3001/api/reservations/history/my-reservations

# Get all history (admin)
GET http://localhost:3001/api/reservations/history
```

## Configuration

The scheduler runs daily at midnight by default. To change the schedule, edit:
`backend/src/modules/reservations/reservations-scheduler.service.ts`

```typescript
// Current: Runs at midnight
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)

// Alternative options:
@Cron(CronExpression.EVERY_HOUR)
@Cron('0 2 * * *') // 2:00 AM daily
```

## Notes

- Only `CONFIRMED` reservations are moved to history
- `PENDING` and `CANCELLED` reservations remain in the main table
- The original reservation is deleted after being moved to history
- All reservation data is preserved in the history table

## Files Created/Modified

### New Files
- `backend/src/modules/reservations/entities/reservation-history.entity.ts`
- `backend/src/database/migrations/20250124_create_reservations_history.sql`
- `backend/src/modules/reservations/reservations-scheduler.service.ts`
- `RESERVATION_HISTORY_IMPLEMENTATION.md` (this file)

### Modified Files
- `backend/src/modules/reservations/reservations.module.ts`
- `backend/src/modules/reservations/reservations.service.ts`
- `backend/src/modules/reservations/reservations.controller.ts`

## Future Enhancements

Possible improvements:
1. Add pagination to history endpoints
2. Add filtering/search capabilities to history
3. Add export functionality for history data
4. Add data retention policies (auto-delete old history after X days)
5. Add frontend UI for viewing reservation history

