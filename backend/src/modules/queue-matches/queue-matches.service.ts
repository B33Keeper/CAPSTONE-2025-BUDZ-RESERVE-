import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';

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
    @InjectRepository(QueuePlayer)
    private readonly queuePlayersRepository: Repository<QueuePlayer>,
    @InjectRepository(QueueingCourt)
    private readonly queueingCourtsRepository: Repository<QueueingCourt>,
  ) {}

  async generateMatches(dto: GenerateQueueMatchesDto) {
    const todayISO = this.getTodayISODate();
    const { startOfDay, endOfDay } = this.getTodayDateRange();

    // Only check against COMPLETED matches today to allow players to play again after completing matches
    // This allows players to generate new matches even if they've already played today,
    // but still prevents duplicate teams in the same generation
    const existingCompletedMatchesToday = await this.queueMatchesRepository.find({
      where: {
        gameType: dto.gameType,
        status: QueueMatchStatus.COMPLETED,
        completedAt: Between(startOfDay, endOfDay),
      },
    });

    const existingTeamSignatures = new Set(
      existingCompletedMatchesToday.flatMap((match) => [
        this.getTeamMembersIdSignature(match.teamA),
        this.getTeamMembersIdSignature(match.teamB),
      ]),
    );

    console.log(
      `[Match Generation] Completed matches today: ${existingCompletedMatchesToday.length}`,
    );

    const players = await this.queuePlayersRepository.find({
      order: { updatedAt: 'ASC' },
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
        // Second priority: include players who played today or haven't played yet
        const lastPlayedISO = this.toISODate(player.lastPlayed);
        const isActiveToday =
          !lastPlayedISO || lastPlayedISO === todayISO;
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
      where: { status: QueueMatchStatus.ACTIVE },
    });

    const playersInActiveMatches = new Set<number>();
    activeMatchesCurrently.forEach((match) => {
      [...match.teamA, ...match.teamB].forEach((player) =>
        playersInActiveMatches.add(player.id),
      );
    });

    console.log(
      `[Match Generation] Existing team signatures from completed matches today: ${existingTeamSignatures.size}`,
      Array.from(existingTeamSignatures).slice(0, 10), // Only show first 10 to avoid log spam
    );
    console.log(
      `[Match Generation] Players in active matches: ${playersInActiveMatches.size}`,
      Array.from(playersInActiveMatches),
    );

    const teams = this.buildTeams(
      eligiblePlayers,
      dto.gameType,
      existingTeamSignatures,
      playersInActiveMatches,
    );

    console.log(
      `[Match Generation] Teams built: ${teams.length}`,
      teams.map((team) => ({
        players: team.map((p) => `${p.name} (${p.id})`),
      })),
    );

    const matchPayloads = this.buildMatchesFromTeams(teams);

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
    orderedPayloads.forEach((payload) => {
      const hasBusyPlayer = this.matchHasBusyPlayer(
        payload,
        busyPlayerIds,
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

  async findAll(status?: QueueMatchStatus) {
    const where = status ? { status } : {};
    return this.queueMatchesRepository.find({
      where,
      order: { status: 'ASC', createdAt: 'ASC' },
    });
  }

  async createMatch(dto: CreateQueueMatchDto): Promise<QueueMatch> {
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
      where: { id: In(uniquePlayerIds) },
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
      where: { status: QueueMatchStatus.ACTIVE },
    });
    const playersInActiveMatches = new Set<number>();
    activeMatches.forEach((match) => {
      [...match.teamA, ...match.teamB].forEach((player) =>
        playersInActiveMatches.add(player.id),
      );
    });

    const hasBusyPlayer = allPlayerIds.some((id) => playersInActiveMatches.has(id));

    // Determine match status: active if court provided and no busy players, pending otherwise
    const status =
      court && !hasBusyPlayer
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
    const match = this.queueMatchesRepository.create({
      gameType: dto.gameType,
      status,
      teamA,
      teamB,
      courtId: court?.id ?? null,
      courtName: court?.name ?? null,
      startedAt: status === QueueMatchStatus.ACTIVE ? new Date() : null,
    });

    const savedMatch = await this.queueMatchesRepository.save(match);

    // Update court status if match is active
    if (court && status === QueueMatchStatus.ACTIVE) {
      await this.queueingCourtsRepository.update(court.id, {
        status: QueueingCourtStatus.OCCUPIED,
      });
    }

    // Update player statuses
    if (status === QueueMatchStatus.ACTIVE) {
      await this.updatePlayersStatus([savedMatch], 'In Match');
    } else {
      await this.updatePlayersStatus([savedMatch], 'Waiting', {
        allowedCurrentStatuses: ['In Queue'],
      });
    }

    return savedMatch;
  }

  async completeMatch(id: number, dto: CompleteQueueMatchDto) {
    const match = await this.queueMatchesRepository.findOne({ where: { id } });
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

    await this.resetPlayersFromMatch(match, true);

    // Automatically activate pending matches if players are now available
    await this.activatePendingMatches(freedPlayerIds, freedCourtId);

    return match;
  }

  private async activatePendingMatches(
    freedPlayerIds: Set<number>,
    availableCourtId: number | null,
  ) {
    if (freedPlayerIds.size === 0) {
      return;
    }

    // Find pending matches that can now be activated (all players are available)
    const pendingMatches = await this.queueMatchesRepository.find({
      where: { status: QueueMatchStatus.PENDING },
      order: { createdAt: 'ASC' }, // Activate oldest pending matches first
    });

    if (pendingMatches.length === 0) {
      return;
    }

    // Check which pending matches can be activated (all players are now available)
    const activeMatches = await this.queueMatchesRepository.find({
      where: { status: QueueMatchStatus.ACTIVE },
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

    let courtIndex = 0;

    for (const pendingMatch of pendingMatches) {
      // Check if all players in this pending match are now available
      const matchPlayerIds = [
        ...pendingMatch.teamA.map((player) => player.id),
        ...pendingMatch.teamB.map((player) => player.id),
      ];

      const allPlayersAvailable = matchPlayerIds.every(
        (playerId) => !playersInActiveMatches.has(playerId),
      );

      if (allPlayersAvailable && courtIndex < availableCourts.length) {
        const court = availableCourts[courtIndex++];

        // Activate this pending match
        pendingMatch.status = QueueMatchStatus.ACTIVE;
        pendingMatch.courtId = court.id;
        pendingMatch.courtName = court.name;
        pendingMatch.startedAt = new Date();
        await this.queueMatchesRepository.save(pendingMatch);

        // Update court status
        await this.queueingCourtsRepository.update(court.id, {
          status: QueueingCourtStatus.OCCUPIED,
        });

        // Update player statuses to "In Match"
        await this.updatePlayersStatus([pendingMatch], 'In Match');

        // Add these players to the active matches set to prevent double activation
        matchPlayerIds.forEach((id) => playersInActiveMatches.add(id));
      }
    }
  }

  async cancelMatch(id: number) {
    const match = await this.queueMatchesRepository.findOne({ where: { id } });
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
      await this.activatePendingMatches(freedPlayerIds, freedCourtId);
    }

    return match;
  }

  async clearPendingMatches() {
    const pendingMatches = await this.queueMatchesRepository.find({
      where: { status: QueueMatchStatus.PENDING },
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

  private async resetPlayersFromMatch(
    match: QueueMatch,
    incrementGamesPlayed: boolean,
  ) {
    const playerIds = [
      ...match.teamA.map((player) => player.id),
      ...match.teamB.map((player) => player.id),
    ];

    // Check which players are still in active or pending matches
    const activeOrPendingMatches = await this.queueMatchesRepository.find({
      where: {
        status: In([QueueMatchStatus.ACTIVE, QueueMatchStatus.PENDING]),
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
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for consistent date comparison

    for (const playerId of playerIds) {
      // Priority: If player is in an active match, status is "In Match"
      // Otherwise, if they're in pending matches or not in any matches, status is "Waiting"
      const newStatus: 'In Match' | 'Waiting' = playersInActiveMatches.has(playerId)
        ? 'In Match'
        : 'Waiting';

      const updateData: any = {
        status: newStatus,
        ...(incrementGamesPlayed
          ? {
              gamesPlayed: () => 'games_played + 1',
              lastPlayed: today, // Update lastPlayed to today when match completes
            }
          : {}),
      };

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

    const usedPlayerIds = new Set<number>();
    const teams: QueueMatchTeamPlayer[][] = [];

    combinations.forEach((combo) => {
      const [playerA, playerB] = combo.players;
      
      // Allow players who are currently in active matches to be reused in pending matches
      // But don't allow the same player to appear twice in the same generation if they're not in an active match
      const playerAIsInActiveMatch = playersInActiveMatches.has(playerA.id);
      const playerBIsInActiveMatch = playersInActiveMatches.has(playerB.id);
      
      // Skip if both players are already used in this generation AND neither is in an active match
      if (
        (!playerAIsInActiveMatch && usedPlayerIds.has(playerA.id)) ||
        (!playerBIsInActiveMatch && usedPlayerIds.has(playerB.id)) ||
        disallowedTeamSignatures.has(combo.signature)
      ) {
        return;
      }

      const team = combo.players.map((player) => this.toMatchPlayer(player));
      disallowedTeamSignatures.add(combo.signature);
      
      // Only mark players as used if they're not in an active match (they can appear in multiple pending matches)
      if (!playerAIsInActiveMatch) {
        usedPlayerIds.add(playerA.id);
      }
      if (!playerBIsInActiveMatch) {
        usedPlayerIds.add(playerB.id);
      }
      
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

    const usedMales = new Set<number>();
    const usedFemales = new Set<number>();
    const teams: QueueMatchTeamPlayer[][] = [];

    combos.forEach((combo) => {
      const [male, female] = combo.players;
      
      // Allow players who are currently in active matches to be reused in pending matches
      const maleIsInActiveMatch = playersInActiveMatches.has(male.id);
      const femaleIsInActiveMatch = playersInActiveMatches.has(female.id);
      
      // Skip if both players are already used in this generation AND neither is in an active match
      if (
        (!maleIsInActiveMatch && usedMales.has(male.id)) ||
        (!femaleIsInActiveMatch && usedFemales.has(female.id)) ||
        disallowedTeamSignatures.has(combo.signature)
      ) {
        return;
      }

      const team = combo.players.map((player) => this.toMatchPlayer(player));
      disallowedTeamSignatures.add(combo.signature);
      
      // Only mark players as used if they're not in an active match (they can appear in multiple pending matches)
      if (!maleIsInActiveMatch) {
        usedMales.add(male.id);
      }
      if (!femaleIsInActiveMatch) {
        usedFemales.add(female.id);
      }
      
      teams.push(team);
    });

    return teams;
  }

  private buildMatchesFromTeams(
    teams: QueueMatchTeamPlayer[][],
  ): { teamA: QueueMatchTeamPlayer[]; teamB: QueueMatchTeamPlayer[] }[] {
    const grouped = new Map<string, TeamWithMeta[]>();

    teams.forEach((team) => {
      const signature = this.getTeamSignature(team);
      const current = grouped.get(signature) ?? [];
      current.push({ players: team, signature });
      grouped.set(signature, current);
    });

    const matches: { teamA: QueueMatchTeamPlayer[]; teamB: QueueMatchTeamPlayer[] }[] = [];

    grouped.forEach((group) => {
      while (group.length >= 2) {
        const first = group.shift()!;
        const second = group.shift()!;
        matches.push({ teamA: first.players, teamB: second.players });
      }
    });

    return matches;
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

