# Queue Players Automated History System

## Overview
The Queue Players system now includes an automated daily cleanup process that manages player history. Players are automatically moved to "history" status based on their `lastPlayed` date.

## How It Works

### Automated Daily Cleanup
- **Schedule**: Runs automatically every day at midnight (00:00)
- **Function**: Identifies players with `lastPlayed` dates before the current day
- **Action**: These players are automatically available in the "Players History" section
- **Logging**: All cleanup operations are logged for monitoring

### Date-Based Filtering
The system uses the `lastPlayed` field to determine player status:
- **Current Queue**: Players with `lastPlayed` = today's date
- **History**: Players with `lastPlayed` < today's date

### Database Structure
All players (current and historical) are stored in the `queue_players` table:
```sql
CREATE TABLE queue_players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120),
  sex ENUM('male', 'female'),
  skill ENUM('Beginner', 'Intermediate', 'Advanced'),
  games_played INT DEFAULT 0,
  status ENUM('In Queue', 'Waiting'),
  last_played DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Manual Cleanup Endpoints

### 1. Check Old Players (Manual Cleanup)
```bash
POST /api/queue-players/cleanup
```
**Response:**
```json
{
  "message": "Found 5 player(s) from previous days",
  "oldPlayersCount": 5,
  "oldPlayers": [...]
}
```

### 2. Delete Old Players
```bash
DELETE /api/queue-players/old?days=30
```
Deletes players older than specified days (default: 30 days)

**Response:**
```json
{
  "message": "Deleted 10 player(s) older than 30 days",
  "deletedCount": 10
}
```

## Frontend Integration

### Current Queue Display
Players are filtered on the frontend:
```typescript
const todaysPlayers = players.filter(player => 
  player.lastPlayed?.slice(0, 10) === todayISODate
);
```

### History Display
Players are grouped by date:
```typescript
const historyByDate = players.reduce((acc, player) => {
  const dateKey = player.lastPlayed?.slice(0, 10);
  if (dateKey < todayISODate) {
    acc[dateKey] = acc[dateKey] || [];
    acc[dateKey].push(player);
  }
  return acc;
}, {});
```

## Installation

1. **Install the package** (if not already done):
```bash
npm install @nestjs/schedule
```

2. **Restart the backend server**:
```bash
npm run start:dev
```

## Monitoring

The scheduler logs important events:
- Daily cleanup start/completion
- Number of old players found
- Details of players being archived
- Any errors during cleanup

Check your application logs for entries from `QueuePlayersSchedulerService`.

## Troubleshooting

### Players Not Showing in History
1. Check the `lastPlayed` date in the database
2. Ensure the date is in the past (< today)
3. Verify the scheduled task is running (check logs)
4. Manually trigger cleanup: `POST /api/queue-players/cleanup`

### Scheduled Task Not Running
1. Verify `ScheduleModule` is imported in `app.module.ts`
2. Check that `QueuePlayersSchedulerService` is registered as a provider
3. Ensure `@nestjs/schedule` package is installed
4. Check server logs for any initialization errors

## Configuration

### Change Cleanup Schedule
Edit `queue-players-scheduler.service.ts`:
```typescript
// Current: Runs at midnight
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)

// Alternative options:
@Cron(CronExpression.EVERY_HOUR)
@Cron('0 2 * * *') // 2:00 AM daily
@Cron('0 0 * * 0') // Midnight every Sunday
```

### Change Data Retention Period
Modify the default retention period:
```typescript
async deleteOldPlayers(daysToKeep: number = 30) // Change 30 to desired days
```

## Benefits

1. **Automatic Archival**: No manual intervention needed
2. **Clean Database**: Old players are automatically organized
3. **Historical Data**: All historical data is preserved and accessible
4. **Manual Control**: Admin can manually trigger cleanup if needed
5. **Configurable**: Easy to adjust schedules and retention policies


