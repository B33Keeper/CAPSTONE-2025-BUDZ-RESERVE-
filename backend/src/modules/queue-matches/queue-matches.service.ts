import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { QueuePlayer } from '../queue-players/entities/queue-player.entity';
import {
  QueueingCourt,
  QueueingCourtStatus,
} from '../queueing-courts/entities/queueing-court.entity';
import {
  QueueMatch,
  QueueMatchGameType,
  QueueMatchStatus,
  QueueMatchTeamPlayer,
  QueueMatchWinner,
} from './entities/queue-match.entity';
import { QueueMatchHistory } from './entities/queue-match-history.entity';
import { GenerateQueueMatchesDto } from './dto/generate-queue-matches.dto';
import { CompleteQueueMatchDto } from './dto/complete-queue-match.dto';
import { CreateQueueMatchDto } from './dto/create-queue-match.dto';

type PlayerSkill = 'Beginner' | 'Intermediate' | 'Advanced';
type PlayerSex = 'male' | 'female';

interface TeamWithMeta {
  players: QueueMatchTeamPlayer[];
  signature: string;
}

type PlayerCombination = {
  players: [QueuePlayer, QueuePlayer];
  diff: number;
  random: number;
  signature: string;
};

@Injectable()
export class QueueMatchesService {
  private readonly skillPriority: Record<PlayerSkill, number> = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3,
  };

  constructor(
    @InjectRepository(QueueMatch)
    private readonly queueMatchesRepository: Repository<QueueMatch>,
    @InjectRepository(QueueMatchHistory)
    private readonly queueMatchesHistoryRepository: Repository<QueueMatchHistory>,
    @InjectRepository(QueuePlayer)
    private readonly queuePlayersRepository: Repository<QueuePlayer>,
    @InjectRepository(QueueingCourt)
    private readonly queueingCourtsRepository: Repository<QueueingCourt>,
  ) {}

  async generateMatches(dto: GenerateQueueMatchesDto, userId: number) {
    const todayISO = this.getTodayISODate();

    // Check if there are any available courts before proceeding
    const availableCourts = await this.queueingCourtsRepository.find({
      where: { status: QueueingCourtStatus.AVAILABLE },
    });

    if (availableCourts.length === 0) {
      console.log(
        `[Match Generation] ERROR: No available courts found. Cannot generate matches.`,
      );
      return {
        matchesGenerated: 0,
        activeMatches: [],
        pendingMatches: [],
        skippedPlayers: [],
        reason: 'There are no active courts. Add courts so you can proceed.',
      };
    }

    // Removed logic that prevents players from being paired in the same team twice
    // Players can now be paired together multiple times

    // Order players by creation time (arrival order) - earlier players get priority
    const players = await this.queuePlayersRepository.find({
      where: { userId },
      order: { createdAt: 'ASC', id: 'ASC' }, // Order by creation time, then ID for consistency
    });

    // Debug: Log all players and their eligibility status
    console.log(`[Match Generation] Total players: ${players.length}`);
    console.log(`[Match Generation] Today ISO: ${todayISO}`);
    console.log(
      `[Match Generation] Players:`,
      players.map((p) => ({
        id: p.id,
        name: p.name,
        sex: p.sex,
        status: p.status,
        lastPlayed: p.lastPlayed,
        lastPlayedISO: this.toISODate(p.lastPlayed),
      })),
    );

    // Include all eligible players regardless of their current status (In Queue, Waiting, or In Match)
    // Players who are already playing can still be included in new matches - those matches will be pending
    // Include players who:
    // 1. Are currently in a match or waiting (status is "In Match" or "Waiting") - ALWAYS eligible, OR
    // 2. Played today (lastPlayed === today), OR
    // 3. Haven't played yet (lastPlayed is null)
    // This ensures players currently playing are included even if their lastPlayed hasn't been updated yet
    const eligiblePlayers = players
      .filter((player) => {
        // First priority: include players who are currently active (In Match/PLAYING or Waiting)
        // These players should ALWAYS be eligible regardless of lastPlayed date
        // Use case-insensitive comparison to handle any status variations
        const normalizedStatus = (player.status || '').trim().toLowerCase();
        if (
          normalizedStatus === 'in match' ||
          normalizedStatus === 'playing' ||
          normalizedStatus === 'waiting'
        ) {
          console.log(
            `[Match Generation] Player ${player.name} (ID: ${player.id}) is eligible - status: ${player.status}`,
          );
          return true;
        }
        // Second priority: include players who played today, haven't played yet, or have future dates
        // Allow players with dates >= today (handles future dates that may be set incorrectly)
        const lastPlayedISO = this.toISODate(player.lastPlayed);
        const isActiveToday =
          !lastPlayedISO || lastPlayedISO >= todayISO;
        console.log(
          `[Match Generation] Player ${player.name} (ID: ${player.id}) - status: ${player.status}, lastPlayedISO: ${lastPlayedISO}, todayISO: ${todayISO}, isActiveToday: ${isActiveToday}`,
        );
        return isActiveToday;
      })
      .filter((player) => {
        const isEligible = this.isEligibleForGameType(player.sex, dto.gameType);
        if (!isEligible) {
          console.log(
            `[Match Generation] Player ${player.name} (ID: ${player.id}) is NOT eligible for game type: ${dto.gameType} (sex: ${player.sex})`,
          );
        }
        return isEligible;
      });

    console.log(
      `[Match Generation] Eligible players for ${dto.gameType}: ${eligiblePlayers.length}`,
      eligiblePlayers.map((p) => ({ id: p.id, name: p.name, sex: p.sex, status: p.status })),
    );

    // Check if we have enough eligible players for the game type
    const requiredPlayers = 4; // All game types require 4 players (2 teams of 2)
    if (eligiblePlayers.length < requiredPlayers) {
      const gameTypeLabel =
        dto.gameType === QueueMatchGameType.MENS_DOUBLES
          ? "Men's Doubles"
          : dto.gameType === QueueMatchGameType.WOMENS_DOUBLES
            ? "Women's Doubles"
            : 'Mixed Doubles';
      const genderRequired =
        dto.gameType === QueueMatchGameType.MENS_DOUBLES
          ? 'male'
          : dto.gameType === QueueMatchGameType.WOMENS_DOUBLES
            ? 'female'
            : 'male and female';
      
      const reason = `Not enough eligible players for ${gameTypeLabel}. Found ${eligiblePlayers.length} eligible player(s) (need ${requiredPlayers}). ${gameTypeLabel} requires ${genderRequired} players.`;
      
      console.log(
        `[Match Generation] ERROR: ${reason}. Eligible players:`,
        eligiblePlayers.map((p) => ({ id: p.id, name: p.name, sex: p.sex, status: p.status })),
      );
      
      return {
        matchesGenerated: 0,
        activeMatches: [],
        pendingMatches: [],
        skippedPlayers: eligiblePlayers.map((player) => player.id),
        reason,
      };
    }

    // Get players who are currently in active matches (they can be in new pending matches)
    const activeMatchesCurrently = await this.queueMatchesRepository.find({
      where: { status: QueueMatchStatus.ACTIVE, userId },
    });

    const playersInActiveMatches = new Set<number>();
    activeMatchesCurrently.forEach((match) => {
      [...match.teamA, ...match.teamB].forEach((player) =>
        playersInActiveMatches.add(player.id),
      );
    });

    console.log(
      `[Match Generation] Players in active matches: ${playersInActiveMatches.size}`,
      Array.from(playersInActiveMatches),
    );

    // Pass empty Set to allow all team combinations (no restrictions on pairing same players)
    const teams = this.buildTeams(
      eligiblePlayers,
      dto.gameType,
      new Set<string>(), // Empty set - no team pairing restrictions
      playersInActiveMatches,
    );

    console.log(
      `[Match Generation] Teams built: ${teams.length}`,
      teams.map((team) => ({
        players: team.map((p) => `${p.name} (${p.id})`),
      })),
    );

    // Pass eligible players to prioritize by arrival order
    const matchPayloads = this.buildMatchesFromTeams(teams, playersInActiveMatches, eligiblePlayers);

    console.log(
      `[Match Generation] Match payloads created: ${matchPayloads.length}`,
      matchPayloads.map((payload) => ({
        teamA: payload.teamA.map((p) => `${p.name} (${p.id})`),
        teamB: payload.teamB.map((p) => `${p.name} (${p.id})`),
      })),
    );

    if (matchPayloads.length === 0) {
      console.log(
        `[Match Generation] ERROR: No match payloads created. Teams: ${teams.length}`,
      );
      return {
        matchesGenerated: 0,
        activeMatches: [],
        pendingMatches: [],
        skippedPlayers: eligiblePlayers.map((player) => player.id),
        reason:
          'Unable to create fair matches with the current player distribution.',
      };
    }

    const availableCourts = await this.queueingCourtsRepository.find({
      where: { status: QueueingCourtStatus.AVAILABLE },
      order: { id: 'ASC' },
    });

    const activeMatches: QueueMatch[] = [];
    const pendingMatches: QueueMatch[] = [];
    const now = new Date();

    // Identify players who are currently in ACTIVE matches (actually playing right now)
    // Only these players should be considered "busy" and prevent matches from starting
    // Players with status "Waiting" but not in active matches should be able to start immediately
    const busyPlayerIds = new Set<number>(playersInActiveMatches);

    console.log(
      `[Match Generation] Available courts: ${availableCourts.length}`,
      availableCourts.map((c) => ({ id: c.id, name: c.name })),
    );
    console.log(
      `[Match Generation] Players in active matches (busy): ${busyPlayerIds.size}`,
      Array.from(busyPlayerIds),
    );

    // Order matches: matches without busy players first (can be active if courts available),
    // then matches with busy players (will be pending)
    const orderedPayloads = [
      ...matchPayloads.filter(
        (payload) =>
          !this.matchHasBusyPlayer(payload, busyPlayerIds),
      ),
      ...matchPayloads.filter((payload) =>
        this.matchHasBusyPlayer(payload, busyPlayerIds),
      ),
    ];

    let courtIndex = 0;
    // Track players that become busy as we assign matches in this batch
    const newlyBusyPlayerIds = new Set<number>(busyPlayerIds);
    
    orderedPayloads.forEach((payload) => {
      // Check if match has any players that are already busy (from existing matches or newly assigned matches)
      const hasBusyPlayer = this.matchHasBusyPlayer(
        payload,
        newlyBusyPlayerIds,
      );
      
      // Only assign courts to matches without busy players (who can start immediately)
      // Matches with busy players go to pending until those players finish their current matches
      // If there are available courts and no busy players, assign court and make it ACTIVE
      const court = !hasBusyPlayer && courtIndex < availableCourts.length
        ? availableCourts[courtIndex++]
        : null;
      const status =
        court && !hasBusyPlayer
          ? QueueMatchStatus.ACTIVE
          : QueueMatchStatus.PENDING;
      
      console.log(
        `[Match Generation] Match ${payload.teamA.map((p) => p.name).join(', ')} vs ${payload.teamB.map((p) => p.name).join(', ')} - hasBusyPlayer: ${hasBusyPlayer}, court: ${court?.name || 'none'}, status: ${status}`,
      );
      const match = this.queueMatchesRepository.create({
        userId,
        gameType: dto.gameType,
        status,
        teamA: payload.teamA,
        teamB: payload.teamB,
        courtId: court?.id ?? null,
        courtName: court?.name ?? null,
        startedAt: court ? now : null,
      });

      if (court) {
        activeMatches.push(match);
        // Mark all players in this match as busy for subsequent matches in this batch
        payload.teamA.forEach((player) => newlyBusyPlayerIds.add(player.id));
        payload.teamB.forEach((player) => newlyBusyPlayerIds.add(player.id));
        console.log(
          `[Match Generation] Marked players as busy: ${[...payload.teamA, ...payload.teamB].map((p) => p.name).join(', ')}`,
        );
      } else {
        pendingMatches.push(match);
      }
    });

    const savedMatches = await this.queueMatchesRepository.save([
      ...activeMatches,
      ...pendingMatches,
    ]);

    await Promise.all(
      activeMatches.map((match) => {
        if (!match.courtId) {
          return Promise.resolve();
        }
        return this.queueingCourtsRepository.update(match.courtId, {
          status: QueueingCourtStatus.OCCUPIED,
        });
      }),
    );

    await this.updatePlayersStatus(activeMatches, 'In Match');
    await this.updatePlayersStatus(pendingMatches, 'Waiting', {
      allowedCurrentStatuses: ['In Queue'],
    });

    // Set eligible players who weren't assigned to any matches to "Waiting"
    const playersInMatches = new Set<number>();
    savedMatches.forEach((match) => {
      [...match.teamA, ...match.teamB].forEach((player) =>
        playersInMatches.add(player.id),
      );
    });

    const playersNotInMatches = eligiblePlayers.filter(
      (player) => !playersInMatches.has(player.id),
    );

    if (playersNotInMatches.length > 0) {
      await this.updatePlayersStatus([], 'Waiting', {
        allowedCurrentStatuses: ['In Queue'],
        specificPlayerIds: playersNotInMatches.map((p) => p.id),
      });
    }

    return {
      matchesGenerated: savedMatches.length,
      activeMatches,
      pendingMatches,
      skippedPlayers: eligiblePlayers
        .filter(
          (player) =>
            !savedMatches.some((match) =>
              [...match.teamA, ...match.teamB].some(
                (matchPlayer) => matchPlayer.id === player.id,
              ),
            ),
        )
        .map((player) => player.id),
    };
  }

  async findAll(status?: QueueMatchStatus, userId?: number) {
    try {
      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (userId) {
        where.userId = userId;
      }
      return await this.queueMatchesRepository.find({
        where,
        order: { status: 'ASC', createdAt: 'ASC' },
      });
    } catch (error) {
      console.error('[QueueMatchesService] Error in findAll:', error);
      throw error;
    }
  }

  async createMatch(dto: CreateQueueMatchDto, userId: number): Promise<QueueMatch> {
    // Validate teams have exactly 2 players each
    if (dto.teamA.length !== 2 || dto.teamB.length !== 2) {
      throw new BadRequestException('Each team must have exactly 2 players.');
    }

    // Validate all player IDs exist and get full player data
    const allPlayerIds = [
      ...dto.teamA.map((p) => p.id),
      ...dto.teamB.map((p) => p.id),
    ];
    const uniquePlayerIds = [...new Set(allPlayerIds)];
    if (uniquePlayerIds.length !== 4) {
      throw new BadRequestException('All players must be unique.');
    }

    const players = await this.queuePlayersRepository.find({
      where: { id: In(uniquePlayerIds), userId },
    });

    if (players.length !== 4) {
      throw new BadRequestException('One or more players not found.');
    }

    // Validate game type matches player genders
    if (dto.gameType === QueueMatchGameType.MENS_DOUBLES) {
      const allMale = [...dto.teamA, ...dto.teamB].every((p) => p.sex === 'male');
      if (!allMale) {
        throw new BadRequestException("Men's Doubles requires all male players.");
      }
    } else if (dto.gameType === QueueMatchGameType.WOMENS_DOUBLES) {
      const allFemale = [...dto.teamA, ...dto.teamB].every((p) => p.sex === 'female');
      if (!allFemale) {
        throw new BadRequestException("Women's Doubles requires all female players.");
      }
    } else if (dto.gameType === QueueMatchGameType.MIXED_DOUBLES) {
      const teamAMixed = dto.teamA.some((p) => p.sex === 'male') && dto.teamA.some((p) => p.sex === 'female');
      const teamBMixed = dto.teamB.some((p) => p.sex === 'male') && dto.teamB.some((p) => p.sex === 'female');
      if (!teamAMixed || !teamBMixed) {
        throw new BadRequestException('Mixed Doubles requires each team to have one male and one female player.');
      }
    }

    // Check court if provided
    let court: QueueingCourt | null = null;
    if (dto.courtId) {
      court = await this.queueingCourtsRepository.findOne({
        where: { id: dto.courtId },
      });
      if (!court) {
        throw new NotFoundException('Court not found.');
      }
      if (court.status !== QueueingCourtStatus.AVAILABLE) {
        throw new BadRequestException('Court is not available.');
      }
    }

    // Check if any players are in active matches
    const activeMatches = await this.queueMatchesRepository.find({
      where: { status: QueueMatchStatus.ACTIVE, userId },
    });
    const playersInActiveMatches = new Set<number>();
    activeMatches.forEach((match) => {
      [...match.teamA, ...match.teamB].forEach((player) =>
        playersInActiveMatches.add(player.id),
      );
    });

    const hasBusyPlayer = allPlayerIds.some((id) => playersInActiveMatches.has(id));

    // Determine match status:
    // - If no busy players AND court is provided: ACTIVE (immediate start)
    // - If busy players exist: PENDING (wait for players to finish, even if court is provided)
    // - If no court provided: PENDING (waiting for court assignment)
    const status = !hasBusyPlayer && court
      ? QueueMatchStatus.ACTIVE
      : QueueMatchStatus.PENDING;

    // Convert team player DTOs to match team players
    const teamA: QueueMatchTeamPlayer[] = dto.teamA.map((p) => ({
      id: p.id,
      name: p.name,
      sex: p.sex,
      skill: p.skill,
    }));
    const teamB: QueueMatchTeamPlayer[] = dto.teamB.map((p) => ({
      id: p.id,
      name: p.name,
      sex: p.sex,
      skill: p.skill,
    }));

    // Create match
    // Store courtId even for pending matches so it can be used when activating
    const match = this.queueMatchesRepository.create({
      userId,
      gameType: dto.gameType,
      status,
      teamA,
      teamB,
      courtId: court?.id ?? null,
      courtName: court?.name ?? null,
      startedAt: status === QueueMatchStatus.ACTIVE ? new Date() : null,
    });

    const savedMatch = await this.queueMatchesRepository.save(match);

    // Update court status only if match is active (not pending)
    // For pending matches, the court remains available until the match is activated
    if (court && status === QueueMatchStatus.ACTIVE) {
      await this.queueingCourtsRepository.update(court.id, {
        status: QueueingCourtStatus.OCCUPIED,
      });
    }

    // Update player statuses only if match is active
    // For pending matches:
    // - If players are busy (in another match), don't change their status
    // - If players are available, set them to "Waiting"
    if (status === QueueMatchStatus.ACTIVE) {
      await this.updatePlayersStatus([savedMatch], 'In Match');
    } else if (!hasBusyPlayer) {
      // Only update status if players are not busy
      // If players are busy, they should remain "In Match" until their current match finishes
      await this.updatePlayersStatus([savedMatch], 'Waiting', {
        allowedCurrentStatuses: ['In Queue'],
      });
    }
    // If hasBusyPlayer is true, don't update player statuses - they're already "In Match"

    return savedMatch;
  }

  async completeMatch(id: number, dto: CompleteQueueMatchDto, userId: number) {
    const match = await this.queueMatchesRepository.findOne({ where: { id, userId } });
    if (!match) {
      throw new NotFoundException('Match not found.');
    }
    if (match.status !== QueueMatchStatus.ACTIVE) {
      throw new BadRequestException('Only active matches can be completed.');
    }

    match.status = QueueMatchStatus.COMPLETED;
    match.completedAt = new Date();
    match.winner = dto.winner;
    await this.queueMatchesRepository.save(match);

    // Save completed match to history
    const historyRecord = this.queueMatchesHistoryRepository.create({
      userId: match.userId,
      originalId: match.id,
      gameType: match.gameType,
      teamA: match.teamA,
      teamB: match.teamB,
      courtId: match.courtId,
      courtName: match.courtName,
      startedAt: match.startedAt,
      completedAt: match.completedAt,
      winner: match.winner,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      archivedAt: new Date(),
    });
    await this.queueMatchesHistoryRepository.save(historyRecord);

    const freedCourtId = match.courtId;
    const freedPlayerIds = new Set<number>([
      ...match.teamA.map((player) => player.id),
      ...match.teamB.map((player) => player.id),
    ]);

    if (freedCourtId) {
      await this.queueingCourtsRepository.update(freedCourtId, {
        status: QueueingCourtStatus.AVAILABLE,
      });
    }

    // Reset player statuses after match completion
    // IMPORTANT: This does NOT delete players - they remain in the queue_players table
    // Players are only moved to history by the scheduler at midnight (based on lastPlayed < today)
    // When a match completes:
    //   - lastPlayed is set to today (keeps players in queue until midnight)
    //   - gamesPlayed is incremented by 1
    //   - status is updated to "In Queue", "Waiting", or "In Match"
    //   - Players NEVER leave the queue_players table when a match completes
    await this.resetPlayersFromMatch(match, true);

    // Automatically activate pending matches if players are now available
    await this.activatePendingMatches(freedPlayerIds, freedCourtId, userId);

    return match;
  }

  private async activatePendingMatches(
    freedPlayerIds: Set<number>,
    availableCourtId: number | null,
    userId: number,
  ) {
    if (freedPlayerIds.size === 0) {
      return;
    }

    // Find pending matches that can now be activated (all players are available)
    const pendingMatches = await this.queueMatchesRepository.find({
      where: { status: QueueMatchStatus.PENDING, userId },
      order: { createdAt: 'ASC' }, // Activate oldest pending matches first
    });

    if (pendingMatches.length === 0) {
      return;
    }

    // Check which pending matches can be activated (all players are now available)
    const activeMatches = await this.queueMatchesRepository.find({
      where: { status: QueueMatchStatus.ACTIVE, userId },
    });

    const playersInActiveMatches = new Set<number>();
    activeMatches.forEach((m) => {
      [...m.teamA, ...m.teamB].forEach((player) =>
        playersInActiveMatches.add(player.id),
      );
    });

    // Get all available courts (including the one that was just freed)
    const availableCourts = await this.queueingCourtsRepository.find({
      where: { status: QueueingCourtStatus.AVAILABLE },
      order: { id: 'ASC' },
    });

    // Create a map of available court IDs for quick lookup
    const availableCourtIds = new Set(availableCourts.map(c => c.id));
    
    // Separate pending matches into two groups:
    // 1. Matches with a specific courtId assigned (should use that court)
    // 2. Matches without a courtId (can use any available court)
    const matchesWithCourt = pendingMatches.filter(m => m.courtId !== null);
    const matchesWithoutCourt = pendingMatches.filter(m => m.courtId === null);

    // Process matches with assigned courts first (prioritize them)
    for (const pendingMatch of [...matchesWithCourt, ...matchesWithoutCourt]) {
      // Check if all players in this pending match are now available
      const matchPlayerIds = [
        ...pendingMatch.teamA.map((player) => player.id),
        ...pendingMatch.teamB.map((player) => player.id),
      ];

      const allPlayersAvailable = matchPlayerIds.every(
        (playerId) => !playersInActiveMatches.has(playerId),
      );

      if (!allPlayersAvailable) {
        continue; // Skip if players are still busy
      }

      // Determine which court to use
      let courtToUse: QueueingCourt | null = null;

      if (pendingMatch.courtId !== null) {
        // Match has a specific court assigned - check if it's available
        const assignedCourt = availableCourts.find(c => c.id === pendingMatch.courtId);
        if (assignedCourt && availableCourtIds.has(assignedCourt.id)) {
          courtToUse = assignedCourt;
        } else {
          // Assigned court is not available, skip this match for now
          // It will be activated when the assigned court becomes available
          continue;
        }
      } else {
        // Match doesn't have a specific court - use any available court
        // Prefer the freed court if available, otherwise use first available
        if (availableCourtId !== null && availableCourtIds.has(availableCourtId)) {
          courtToUse = availableCourts.find(c => c.id === availableCourtId) || null;
        }
        
        if (!courtToUse && availableCourts.length > 0) {
          // Use first available court
          courtToUse = availableCourts.find(c => availableCourtIds.has(c.id)) || null;
        }
      }

      if (courtToUse) {
        // Activate this pending match
        pendingMatch.status = QueueMatchStatus.ACTIVE;
        pendingMatch.courtId = courtToUse.id;
        pendingMatch.courtName = courtToUse.name;
        pendingMatch.startedAt = new Date();
        await this.queueMatchesRepository.save(pendingMatch);

        // Update court status
        await this.queueingCourtsRepository.update(courtToUse.id, {
          status: QueueingCourtStatus.OCCUPIED,
        });

        // Remove court from available set to prevent double assignment
        availableCourtIds.delete(courtToUse.id);

        // Update player statuses to "In Match"
        await this.updatePlayersStatus([pendingMatch], 'In Match');

        // Add these players to the active matches set to prevent double activation
        matchPlayerIds.forEach((id) => playersInActiveMatches.add(id));
      }
    }
  }

  async cancelMatch(id: number, userId: number) {
    const match = await this.queueMatchesRepository.findOne({ where: { id, userId } });
    if (!match) {
      throw new NotFoundException('Match not found.');
    }

    if (
      match.status !== QueueMatchStatus.ACTIVE &&
      match.status !== QueueMatchStatus.PENDING
    ) {
      throw new BadRequestException('Only pending or active matches can be cancelled.');
    }

    // Store original status and IDs before cancelling (for activating pending matches)
    const wasActive = match.status === QueueMatchStatus.ACTIVE;
    const freedPlayerIds = new Set<number>([
      ...match.teamA.map((player) => player.id),
      ...match.teamB.map((player) => player.id),
    ]);
    const freedCourtId = match.courtId;

    match.status = QueueMatchStatus.CANCELLED;
    match.completedAt = new Date();
    await this.queueMatchesRepository.save(match);

    if (match.courtId) {
      await this.queueingCourtsRepository.update(match.courtId, {
        status: QueueingCourtStatus.AVAILABLE,
      });
    }

    await this.resetPlayersFromMatch(match, false);

    // If an active match was cancelled, try to activate pending matches
    // This will automatically assign pending matches to the freed court
    if (wasActive && freedCourtId) {
      await this.activatePendingMatches(freedPlayerIds, freedCourtId, userId);
    }

    return match;
  }

  async clearPendingMatches(userId: number) {
    const pendingMatches = await this.queueMatchesRepository.find({
      where: { status: QueueMatchStatus.PENDING, userId },
    });

    if (!pendingMatches.length) {
      return { cleared: 0 };
    }

    await Promise.all(
      pendingMatches.map((match) => this.resetPlayersFromMatch(match, false)),
    );

    const pendingIds = pendingMatches.map((match) => match.id);
    await this.queueMatchesRepository.delete(pendingIds);

    return { cleared: pendingIds.length };
  }

  private async resetExistingMatches() {
    const existing = await this.queueMatchesRepository.find({
      where: {
        status: In([QueueMatchStatus.ACTIVE, QueueMatchStatus.PENDING]),
      },
    });

    if (existing.length === 0) {
      return;
    }

    const courtIds = existing
      .filter((match) => match.courtId)
      .map((match) => match.courtId) as number[];

    if (courtIds.length > 0) {
      await this.queueingCourtsRepository.update(
        { id: In(courtIds) },
        { status: QueueingCourtStatus.AVAILABLE },
      );
    }

    const playerIds = new Set<number>();
    existing.forEach((match) => {
      [...match.teamA, ...match.teamB].forEach((player) =>
        playerIds.add(player.id),
      );
    });

    if (playerIds.size > 0) {
      await this.queuePlayersRepository
        .createQueryBuilder()
        .update()
        .set({ status: 'In Queue' })
        .whereInIds([...playerIds])
        .execute();
    }

    const matchIds = existing.map((match) => match.id);
    if (matchIds.length > 0) {
      await this.queueMatchesRepository.delete(matchIds);
    }
  }

  /**
   * Reset player statuses after a match completes or is cancelled
   * When incrementGamesPlayed is true (match completed):
   * - Updates lastPlayed to today (so players remain in today's queue)
   * - Increments gamesPlayed by 1
   * - Sets status to "Waiting" (unless player is in another active match)
   * 
   * This ensures players stay in the queue after match completion
   */
  private async resetPlayersFromMatch(
    match: QueueMatch,
    incrementGamesPlayed: boolean,
  ) {
    const playerIds = [
      ...match.teamA.map((player) => player.id),
      ...match.teamB.map((player) => player.id),
    ];

    // Check which players are still in active or pending matches
    // Note: We need to get the userId from the match to filter properly
    const activeOrPendingMatches = await this.queueMatchesRepository.find({
      where: {
        status: In([QueueMatchStatus.ACTIVE, QueueMatchStatus.PENDING]),
        userId: match.userId, // Filter by same user
      },
    });

    const playersInActiveMatches = new Set<number>();
    const playersInPendingMatches = new Set<number>();

    activeOrPendingMatches.forEach((m) => {
      const playerIdsInMatch = [...m.teamA, ...m.teamB].map((p) => p.id);
      playerIdsInMatch.forEach((playerId) => {
        if (m.status === QueueMatchStatus.ACTIVE) {
          playersInActiveMatches.add(playerId);
        } else if (m.status === QueueMatchStatus.PENDING) {
          playersInPendingMatches.add(playerId);
        }
      });
    });

    // Update each player based on their current match status
    // IMPORTANT: Players are NEVER deleted here - they remain in the queue players table
    // Players are only moved to history by the scheduler at midnight based on lastPlayed date
    // Use local timezone to get today's date (date only, no time component)
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    localToday.setHours(0, 0, 0, 0); // Set to start of day for consistent date comparison

    for (const playerId of playerIds) {
      // Priority: If player is in an active match, status is "In Match"
      // Otherwise, set status to "Waiting" or "In Queue" - this ensures players remain in queue
      const newStatus: 'In Match' | 'Waiting' | 'In Queue' = playersInActiveMatches.has(playerId)
        ? 'In Match'
        : playersInPendingMatches.has(playerId)
        ? 'Waiting'
        : 'In Queue'; // Players return to "In Queue" status after match completion if not in other matches

      const updateData: any = {
        status: newStatus,
        // Always update lastPlayed to today when match completes to keep players in queue
        // This ensures players are NOT moved to history until the day ends (midnight scheduler)
        // Use localToday to avoid timezone issues
        lastPlayed: localToday,
        ...(incrementGamesPlayed
          ? {
              // Increment gamesPlayed by 1 - players stay in table, just their game count increases
              gamesPlayed: () => 'games_played + 1',
            }
          : {}),
      };

      // CRITICAL: Update player - NEVER DELETE
      // Players ALWAYS remain in queue_players table when matches complete
      // They are only removed by:
      //   1. Manual deletion via DELETE endpoint
      //   2. Automatic scheduler at midnight (moves to history if lastPlayed < today)
      // Completing a match sets lastPlayed to today, so players stay until midnight
      await this.queuePlayersRepository
        .createQueryBuilder()
        .update()
        .set(updateData)
        .where('id = :id', { id: playerId })
        .execute();
    }
  }

  private async updatePlayersStatus(
    matches: QueueMatch[],
    status: QueuePlayer['status'],
    options?: {
      allowedCurrentStatuses?: QueuePlayer['status'][];
      specificPlayerIds?: number[];
    },
  ) {
    const playerIds = new Set<number>();

    // If specific player IDs are provided, use those
    if (options?.specificPlayerIds) {
      options.specificPlayerIds.forEach((id) => playerIds.add(id));
    } else {
      // Otherwise, extract player IDs from matches
      if (!matches.length) {
        return;
      }

      matches.forEach((match) => {
        [...match.teamA, ...match.teamB].forEach((player) =>
          playerIds.add(player.id),
        );
      });
    }

    if (playerIds.size === 0) {
      return;
    }

    let query = this.queuePlayersRepository
      .createQueryBuilder()
      .update()
      .set({ status })
      .whereInIds([...playerIds]);

    if (options?.allowedCurrentStatuses?.length) {
      query = query.andWhere('status IN (:...statuses)', {
        statuses: options.allowedCurrentStatuses,
      });
    }

    await query.execute();
  }

  private toISODate(date: Date | string | null): string | null {
    if (!date) return null;
    if (typeof date === 'string') {
      return date.slice(0, 10);
    }
    // Use local timezone instead of UTC to match getTodayISODate()
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getTodayISODate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getTodayDateRange() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return { startOfDay, endOfDay };
  }

  private isEligibleForGameType(sex: PlayerSex, gameType: QueueMatchGameType) {
    if (gameType === QueueMatchGameType.MENS_DOUBLES) {
      return sex === 'male';
    }
    if (gameType === QueueMatchGameType.WOMENS_DOUBLES) {
      return sex === 'female';
    }
    return true;
  }

  private buildTeams(
    players: QueuePlayer[],
    gameType: QueueMatchGameType,
    disallowedTeamSignatures: Set<string>,
    playersInActiveMatches: Set<number> = new Set(),
  ): QueueMatchTeamPlayer[][] {
    if (gameType === QueueMatchGameType.MIXED_DOUBLES) {
      return this.buildMixedTeams(players, disallowedTeamSignatures, playersInActiveMatches);
    }

    return this.buildSameSexTeams(players, disallowedTeamSignatures, playersInActiveMatches);
  }

  private buildSameSexTeams(
    players: QueuePlayer[],
    disallowedTeamSignatures: Set<string>,
    playersInActiveMatches: Set<number> = new Set(),
  ): QueueMatchTeamPlayer[][] {
    if (players.length < 2) {
      return [];
    }

    const combinations = this.buildPlayerCombinations(players);
    const teams: QueueMatchTeamPlayer[][] = [];

    // Generate all possible teams - removed restriction on pairing same players twice
    // Players can now be paired together multiple times
    combinations.forEach((combo) => {
      const team = combo.players.map((player) => this.toMatchPlayer(player));
      teams.push(team);
    });

    return teams;
  }

  private buildMixedTeams(
    players: QueuePlayer[],
    disallowedTeamSignatures: Set<string>,
    playersInActiveMatches: Set<number> = new Set(),
  ): QueueMatchTeamPlayer[][] {
    const males = players.filter((player) => player.sex === 'male');
    const females = players.filter((player) => player.sex === 'female');

    if (!males.length || !females.length) {
      return [];
    }

    const combos: PlayerCombination[] = [];
    males.forEach((male) => {
      females.forEach((female) => {
        combos.push({
          players: [male, female],
          diff: Math.abs(
            this.skillPriority[male.skill] - this.skillPriority[female.skill],
          ),
          random: Math.random(),
          signature: this.getPlayerPairSignatureFromPlayers(male, female),
        });
      });
    });

    combos.sort((a, b) => a.diff - b.diff || a.random - b.random);

    const teams: QueueMatchTeamPlayer[][] = [];

    // Generate all possible teams - removed restriction on pairing same players twice
    // Players can now be paired together multiple times
    combos.forEach((combo) => {
      const team = combo.players.map((player) => this.toMatchPlayer(player));
      teams.push(team);
    });

    return teams;
  }

  private buildMatchesFromTeams(
    teams: QueueMatchTeamPlayer[][],
    playersInActiveMatches: Set<number> = new Set(),
    eligiblePlayers: QueuePlayer[] = [],
  ): { teamA: QueueMatchTeamPlayer[]; teamB: QueueMatchTeamPlayer[] }[] {
    // Helper function to check if two teams share any players
    const teamsSharePlayers = (team1: QueueMatchTeamPlayer[], team2: QueueMatchTeamPlayer[]): boolean => {
      const team1Ids = new Set(team1.map(p => p.id));
      return team2.some(p => team1Ids.has(p.id));
    };

    // Helper function to calculate skill similarity score (lower is better)
    const calculateSkillScore = (team1: QueueMatchTeamPlayer[], team2: QueueMatchTeamPlayer[]): number => {
      const team1Skills = team1.map(p => this.skillPriority[p.skill]);
      const team2Skills = team2.map(p => this.skillPriority[p.skill]);
      
      // Calculate average skill for each team
      const avg1 = team1Skills.reduce((a, b) => a + b, 0) / team1Skills.length;
      const avg2 = team2Skills.reduce((a, b) => a + b, 0) / team2Skills.length;
      
      // Return the absolute difference (lower = more similar)
      return Math.abs(avg1 - avg2);
    };

    // Generate all possible valid match pairs (teams that don't share players)
    const validMatches: Array<{
      teamA: QueueMatchTeamPlayer[];
      teamB: QueueMatchTeamPlayer[];
      score: number;
      playerIds: Set<number>;
    }> = [];

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const teamA = teams[i];
        const teamB = teams[j];
        
        // Only consider pairs where teams don't share players
        if (!teamsSharePlayers(teamA, teamB)) {
          const playerIds = new Set<number>();
          teamA.forEach(p => playerIds.add(p.id));
          teamB.forEach(p => playerIds.add(p.id));
          
          validMatches.push({
            teamA,
            teamB,
            score: calculateSkillScore(teamA, teamB),
            playerIds,
          });
        }
      }
    }

    // Helper function to get player priority (lower = earlier arrival)
    const getPlayerPriority = (playerId: number): number => {
      const index = eligiblePlayers.findIndex(p => p.id === playerId);
      return index === -1 ? 9999 : index; // Players not found get lowest priority
    };

    // Sort matches to prioritize those with earlier-arriving players
    // First priority: matches with players who arrived earlier (lower index)
    // Second priority: skill similarity (lower score = better match)
    if (validMatches.length > 0) {
      validMatches.sort((a, b) => {
        // Get the minimum player priority (earliest arrival) for each match
        const aPriorities = Array.from(a.playerIds).map(id => getPlayerPriority(id));
        const bPriorities = Array.from(b.playerIds).map(id => getPlayerPriority(id));
        
        // Only calculate min if arrays are not empty
        const aMinPriority = aPriorities.length > 0 ? Math.min(...aPriorities) : 9999;
        const bMinPriority = bPriorities.length > 0 ? Math.min(...bPriorities) : 9999;
        
        // Prioritize matches with earlier-arriving players
        if (aMinPriority !== bMinPriority) {
          return aMinPriority - bMinPriority; // Lower priority number = earlier arrival
        }
        
        // If same arrival priority, use skill score (better skill match)
        return a.score - b.score;
      });
    }

    // Generate ALL possible matches - prioritize by arrival order
    // Players can be in multiple matches (especially pending ones)
    const selectedMatches: { teamA: QueueMatchTeamPlayer[]; teamB: QueueMatchTeamPlayer[] }[] = [];

    // Generate all possible matches
    // Only restriction: players in active matches can't be in another active match at the same time
    // But they can be in pending matches
    for (const match of validMatches) {
      // Add all matches - they will be marked as active or pending based on player availability
      // when assigning courts
      selectedMatches.push({ teamA: match.teamA, teamB: match.teamB });
    }

    return selectedMatches;
  }

  private getTeamSignature(team: QueueMatchTeamPlayer[]) {
    return [...team]
      .map((player) => player.skill)
      .sort()
      .join('|');
  }
  private getPlayerPairSignatureFromPlayers(
    playerA: { id: number },
    playerB: { id: number },
  ) {
    return [playerA.id, playerB.id].sort((a, b) => a - b).join('-');
  }

  private buildPlayerCombinations(
    players: QueuePlayer[],
  ): PlayerCombination[] {
    const combos: PlayerCombination[] = [];

    for (let i = 0; i < players.length; i += 1) {
      for (let j = i + 1; j < players.length; j += 1) {
        const first = players[i];
        const second = players[j];
        combos.push({
          players: [first, second],
          diff: Math.abs(
            this.skillPriority[first.skill] - this.skillPriority[second.skill],
          ),
          random: Math.random(),
          signature: this.getPlayerPairSignatureFromPlayers(first, second),
        });
      }
    }

    combos.sort((a, b) => a.diff - b.diff || a.random - b.random);
    return combos;
  }


  private getTeamMembersIdSignature(team: QueueMatchTeamPlayer[]) {
    return [...team]
      .map((player) => player.id)
      .sort((a, b) => a - b)
      .join('-');
  }

  /**
   * Get all match history records for a user
   * @param userId - The user ID to filter history records
   * @returns Array of history records ordered by archivedAt descending
   */
  async findHistory(userId: number): Promise<QueueMatchHistory[]> {
    return this.queueMatchesHistoryRepository.find({
      where: { userId },
      order: {
        archivedAt: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  private matchHasBusyPlayer(
    payload: { teamA: QueueMatchTeamPlayer[]; teamB: QueueMatchTeamPlayer[] },
    busyPlayerIds: Set<number>,
  ) {
    return [...payload.teamA, ...payload.teamB].some((player) =>
      busyPlayerIds.has(player.id),
    );
  }

  private toMatchPlayer(player: QueuePlayer): QueueMatchTeamPlayer {
    return {
      id: player.id,
      name: player.name,
      sex: player.sex,
      skill: player.skill,
    };
  }
}

