"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueMatchesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const queue_player_entity_1 = require("../queue-players/entities/queue-player.entity");
const queueing_court_entity_1 = require("../queueing-courts/entities/queueing-court.entity");
const queue_match_entity_1 = require("./entities/queue-match.entity");
const queue_match_history_entity_1 = require("./entities/queue-match-history.entity");
let QueueMatchesService = class QueueMatchesService {
    constructor(queueMatchesRepository, queueMatchesHistoryRepository, queuePlayersRepository, queueingCourtsRepository) {
        this.queueMatchesRepository = queueMatchesRepository;
        this.queueMatchesHistoryRepository = queueMatchesHistoryRepository;
        this.queuePlayersRepository = queuePlayersRepository;
        this.queueingCourtsRepository = queueingCourtsRepository;
        this.skillPriority = {
            Beginner: 1,
            Intermediate: 2,
            Advanced: 3,
        };
    }
    async generateMatches(dto, userId) {
        const todayISO = this.getTodayISODate();
        const { startOfDay, endOfDay } = this.getTodayDateRange();
        const existingCompletedMatchesToday = await this.queueMatchesRepository.find({
            where: {
                userId,
                gameType: dto.gameType,
                status: queue_match_entity_1.QueueMatchStatus.COMPLETED,
                completedAt: (0, typeorm_2.Between)(startOfDay, endOfDay),
            },
        });
        const existingTeamSignatures = new Set(existingCompletedMatchesToday.flatMap((match) => [
            this.getTeamMembersIdSignature(match.teamA),
            this.getTeamMembersIdSignature(match.teamB),
        ]));
        console.log(`[Match Generation] Completed matches today: ${existingCompletedMatchesToday.length}`);
        const players = await this.queuePlayersRepository.find({
            where: { userId },
            order: { updatedAt: 'ASC' },
        });
        console.log(`[Match Generation] Total players: ${players.length}`);
        console.log(`[Match Generation] Today ISO: ${todayISO}`);
        console.log(`[Match Generation] Players:`, players.map((p) => ({
            id: p.id,
            name: p.name,
            sex: p.sex,
            status: p.status,
            lastPlayed: p.lastPlayed,
            lastPlayedISO: this.toISODate(p.lastPlayed),
        })));
        const eligiblePlayers = players
            .filter((player) => {
            const normalizedStatus = (player.status || '').trim().toLowerCase();
            if (normalizedStatus === 'in match' ||
                normalizedStatus === 'playing' ||
                normalizedStatus === 'waiting') {
                console.log(`[Match Generation] Player ${player.name} (ID: ${player.id}) is eligible - status: ${player.status}`);
                return true;
            }
            const lastPlayedISO = this.toISODate(player.lastPlayed);
            const isActiveToday = !lastPlayedISO || lastPlayedISO === todayISO;
            console.log(`[Match Generation] Player ${player.name} (ID: ${player.id}) - status: ${player.status}, lastPlayedISO: ${lastPlayedISO}, todayISO: ${todayISO}, isActiveToday: ${isActiveToday}`);
            return isActiveToday;
        })
            .filter((player) => {
            const isEligible = this.isEligibleForGameType(player.sex, dto.gameType);
            if (!isEligible) {
                console.log(`[Match Generation] Player ${player.name} (ID: ${player.id}) is NOT eligible for game type: ${dto.gameType} (sex: ${player.sex})`);
            }
            return isEligible;
        });
        console.log(`[Match Generation] Eligible players for ${dto.gameType}: ${eligiblePlayers.length}`, eligiblePlayers.map((p) => ({ id: p.id, name: p.name, sex: p.sex, status: p.status })));
        const requiredPlayers = 4;
        if (eligiblePlayers.length < requiredPlayers) {
            const gameTypeLabel = dto.gameType === queue_match_entity_1.QueueMatchGameType.MENS_DOUBLES
                ? "Men's Doubles"
                : dto.gameType === queue_match_entity_1.QueueMatchGameType.WOMENS_DOUBLES
                    ? "Women's Doubles"
                    : 'Mixed Doubles';
            const genderRequired = dto.gameType === queue_match_entity_1.QueueMatchGameType.MENS_DOUBLES
                ? 'male'
                : dto.gameType === queue_match_entity_1.QueueMatchGameType.WOMENS_DOUBLES
                    ? 'female'
                    : 'male and female';
            const reason = `Not enough eligible players for ${gameTypeLabel}. Found ${eligiblePlayers.length} eligible player(s) (need ${requiredPlayers}). ${gameTypeLabel} requires ${genderRequired} players.`;
            console.log(`[Match Generation] ERROR: ${reason}. Eligible players:`, eligiblePlayers.map((p) => ({ id: p.id, name: p.name, sex: p.sex, status: p.status })));
            return {
                matchesGenerated: 0,
                activeMatches: [],
                pendingMatches: [],
                skippedPlayers: eligiblePlayers.map((player) => player.id),
                reason,
            };
        }
        const activeMatchesCurrently = await this.queueMatchesRepository.find({
            where: { status: queue_match_entity_1.QueueMatchStatus.ACTIVE, userId },
        });
        const playersInActiveMatches = new Set();
        activeMatchesCurrently.forEach((match) => {
            [...match.teamA, ...match.teamB].forEach((player) => playersInActiveMatches.add(player.id));
        });
        console.log(`[Match Generation] Existing team signatures from completed matches today: ${existingTeamSignatures.size}`, Array.from(existingTeamSignatures).slice(0, 10));
        console.log(`[Match Generation] Players in active matches: ${playersInActiveMatches.size}`, Array.from(playersInActiveMatches));
        const teams = this.buildTeams(eligiblePlayers, dto.gameType, existingTeamSignatures, playersInActiveMatches);
        console.log(`[Match Generation] Teams built: ${teams.length}`, teams.map((team) => ({
            players: team.map((p) => `${p.name} (${p.id})`),
        })));
        const matchPayloads = this.buildMatchesFromTeams(teams, playersInActiveMatches);
        console.log(`[Match Generation] Match payloads created: ${matchPayloads.length}`, matchPayloads.map((payload) => ({
            teamA: payload.teamA.map((p) => `${p.name} (${p.id})`),
            teamB: payload.teamB.map((p) => `${p.name} (${p.id})`),
        })));
        if (matchPayloads.length === 0) {
            console.log(`[Match Generation] ERROR: No match payloads created. Teams: ${teams.length}`);
            return {
                matchesGenerated: 0,
                activeMatches: [],
                pendingMatches: [],
                skippedPlayers: eligiblePlayers.map((player) => player.id),
                reason: 'Unable to create fair matches with the current player distribution.',
            };
        }
        const availableCourts = await this.queueingCourtsRepository.find({
            where: { status: queueing_court_entity_1.QueueingCourtStatus.AVAILABLE },
            order: { id: 'ASC' },
        });
        const activeMatches = [];
        const pendingMatches = [];
        const now = new Date();
        const busyPlayerIds = new Set(playersInActiveMatches);
        console.log(`[Match Generation] Available courts: ${availableCourts.length}`, availableCourts.map((c) => ({ id: c.id, name: c.name })));
        console.log(`[Match Generation] Players in active matches (busy): ${busyPlayerIds.size}`, Array.from(busyPlayerIds));
        const orderedPayloads = [
            ...matchPayloads.filter((payload) => !this.matchHasBusyPlayer(payload, busyPlayerIds)),
            ...matchPayloads.filter((payload) => this.matchHasBusyPlayer(payload, busyPlayerIds)),
        ];
        let courtIndex = 0;
        orderedPayloads.forEach((payload) => {
            const hasBusyPlayer = this.matchHasBusyPlayer(payload, busyPlayerIds);
            const court = !hasBusyPlayer && courtIndex < availableCourts.length
                ? availableCourts[courtIndex++]
                : null;
            const status = court && !hasBusyPlayer
                ? queue_match_entity_1.QueueMatchStatus.ACTIVE
                : queue_match_entity_1.QueueMatchStatus.PENDING;
            console.log(`[Match Generation] Match ${payload.teamA.map((p) => p.name).join(', ')} vs ${payload.teamB.map((p) => p.name).join(', ')} - hasBusyPlayer: ${hasBusyPlayer}, court: ${court?.name || 'none'}, status: ${status}`);
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
            }
            else {
                pendingMatches.push(match);
            }
        });
        const savedMatches = await this.queueMatchesRepository.save([
            ...activeMatches,
            ...pendingMatches,
        ]);
        await Promise.all(activeMatches.map((match) => {
            if (!match.courtId) {
                return Promise.resolve();
            }
            return this.queueingCourtsRepository.update(match.courtId, {
                status: queueing_court_entity_1.QueueingCourtStatus.OCCUPIED,
            });
        }));
        await this.updatePlayersStatus(activeMatches, 'In Match');
        await this.updatePlayersStatus(pendingMatches, 'Waiting', {
            allowedCurrentStatuses: ['In Queue'],
        });
        const playersInMatches = new Set();
        savedMatches.forEach((match) => {
            [...match.teamA, ...match.teamB].forEach((player) => playersInMatches.add(player.id));
        });
        const playersNotInMatches = eligiblePlayers.filter((player) => !playersInMatches.has(player.id));
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
                .filter((player) => !savedMatches.some((match) => [...match.teamA, ...match.teamB].some((matchPlayer) => matchPlayer.id === player.id)))
                .map((player) => player.id),
        };
    }
    async findAll(status, userId) {
        const where = {};
        if (status) {
            where.status = status;
        }
        if (userId) {
            where.userId = userId;
        }
        return this.queueMatchesRepository.find({
            where,
            order: { status: 'ASC', createdAt: 'ASC' },
        });
    }
    async createMatch(dto, userId) {
        if (dto.teamA.length !== 2 || dto.teamB.length !== 2) {
            throw new common_1.BadRequestException('Each team must have exactly 2 players.');
        }
        const allPlayerIds = [
            ...dto.teamA.map((p) => p.id),
            ...dto.teamB.map((p) => p.id),
        ];
        const uniquePlayerIds = [...new Set(allPlayerIds)];
        if (uniquePlayerIds.length !== 4) {
            throw new common_1.BadRequestException('All players must be unique.');
        }
        const players = await this.queuePlayersRepository.find({
            where: { id: (0, typeorm_2.In)(uniquePlayerIds), userId },
        });
        if (players.length !== 4) {
            throw new common_1.BadRequestException('One or more players not found.');
        }
        if (dto.gameType === queue_match_entity_1.QueueMatchGameType.MENS_DOUBLES) {
            const allMale = [...dto.teamA, ...dto.teamB].every((p) => p.sex === 'male');
            if (!allMale) {
                throw new common_1.BadRequestException("Men's Doubles requires all male players.");
            }
        }
        else if (dto.gameType === queue_match_entity_1.QueueMatchGameType.WOMENS_DOUBLES) {
            const allFemale = [...dto.teamA, ...dto.teamB].every((p) => p.sex === 'female');
            if (!allFemale) {
                throw new common_1.BadRequestException("Women's Doubles requires all female players.");
            }
        }
        else if (dto.gameType === queue_match_entity_1.QueueMatchGameType.MIXED_DOUBLES) {
            const teamAMixed = dto.teamA.some((p) => p.sex === 'male') && dto.teamA.some((p) => p.sex === 'female');
            const teamBMixed = dto.teamB.some((p) => p.sex === 'male') && dto.teamB.some((p) => p.sex === 'female');
            if (!teamAMixed || !teamBMixed) {
                throw new common_1.BadRequestException('Mixed Doubles requires each team to have one male and one female player.');
            }
        }
        let court = null;
        if (dto.courtId) {
            court = await this.queueingCourtsRepository.findOne({
                where: { id: dto.courtId },
            });
            if (!court) {
                throw new common_1.NotFoundException('Court not found.');
            }
            if (court.status !== queueing_court_entity_1.QueueingCourtStatus.AVAILABLE) {
                throw new common_1.BadRequestException('Court is not available.');
            }
        }
        const activeMatches = await this.queueMatchesRepository.find({
            where: { status: queue_match_entity_1.QueueMatchStatus.ACTIVE, userId },
        });
        const playersInActiveMatches = new Set();
        activeMatches.forEach((match) => {
            [...match.teamA, ...match.teamB].forEach((player) => playersInActiveMatches.add(player.id));
        });
        const hasBusyPlayer = allPlayerIds.some((id) => playersInActiveMatches.has(id));
        const status = !hasBusyPlayer && court
            ? queue_match_entity_1.QueueMatchStatus.ACTIVE
            : queue_match_entity_1.QueueMatchStatus.PENDING;
        const teamA = dto.teamA.map((p) => ({
            id: p.id,
            name: p.name,
            sex: p.sex,
            skill: p.skill,
        }));
        const teamB = dto.teamB.map((p) => ({
            id: p.id,
            name: p.name,
            sex: p.sex,
            skill: p.skill,
        }));
        const match = this.queueMatchesRepository.create({
            userId,
            gameType: dto.gameType,
            status,
            teamA,
            teamB,
            courtId: court?.id ?? null,
            courtName: court?.name ?? null,
            startedAt: status === queue_match_entity_1.QueueMatchStatus.ACTIVE ? new Date() : null,
        });
        const savedMatch = await this.queueMatchesRepository.save(match);
        if (court && status === queue_match_entity_1.QueueMatchStatus.ACTIVE) {
            await this.queueingCourtsRepository.update(court.id, {
                status: queueing_court_entity_1.QueueingCourtStatus.OCCUPIED,
            });
        }
        if (status === queue_match_entity_1.QueueMatchStatus.ACTIVE) {
            await this.updatePlayersStatus([savedMatch], 'In Match');
        }
        else if (!hasBusyPlayer) {
            await this.updatePlayersStatus([savedMatch], 'Waiting', {
                allowedCurrentStatuses: ['In Queue'],
            });
        }
        return savedMatch;
    }
    async completeMatch(id, dto, userId) {
        const match = await this.queueMatchesRepository.findOne({ where: { id, userId } });
        if (!match) {
            throw new common_1.NotFoundException('Match not found.');
        }
        if (match.status !== queue_match_entity_1.QueueMatchStatus.ACTIVE) {
            throw new common_1.BadRequestException('Only active matches can be completed.');
        }
        match.status = queue_match_entity_1.QueueMatchStatus.COMPLETED;
        match.completedAt = new Date();
        match.winner = dto.winner;
        await this.queueMatchesRepository.save(match);
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
        const freedPlayerIds = new Set([
            ...match.teamA.map((player) => player.id),
            ...match.teamB.map((player) => player.id),
        ]);
        if (freedCourtId) {
            await this.queueingCourtsRepository.update(freedCourtId, {
                status: queueing_court_entity_1.QueueingCourtStatus.AVAILABLE,
            });
        }
        await this.resetPlayersFromMatch(match, true);
        await this.activatePendingMatches(freedPlayerIds, freedCourtId, userId);
        return match;
    }
    async activatePendingMatches(freedPlayerIds, availableCourtId, userId) {
        if (freedPlayerIds.size === 0) {
            return;
        }
        const pendingMatches = await this.queueMatchesRepository.find({
            where: { status: queue_match_entity_1.QueueMatchStatus.PENDING, userId },
            order: { createdAt: 'ASC' },
        });
        if (pendingMatches.length === 0) {
            return;
        }
        const activeMatches = await this.queueMatchesRepository.find({
            where: { status: queue_match_entity_1.QueueMatchStatus.ACTIVE, userId },
        });
        const playersInActiveMatches = new Set();
        activeMatches.forEach((m) => {
            [...m.teamA, ...m.teamB].forEach((player) => playersInActiveMatches.add(player.id));
        });
        const availableCourts = await this.queueingCourtsRepository.find({
            where: { status: queueing_court_entity_1.QueueingCourtStatus.AVAILABLE },
            order: { id: 'ASC' },
        });
        const availableCourtIds = new Set(availableCourts.map(c => c.id));
        const matchesWithCourt = pendingMatches.filter(m => m.courtId !== null);
        const matchesWithoutCourt = pendingMatches.filter(m => m.courtId === null);
        for (const pendingMatch of [...matchesWithCourt, ...matchesWithoutCourt]) {
            const matchPlayerIds = [
                ...pendingMatch.teamA.map((player) => player.id),
                ...pendingMatch.teamB.map((player) => player.id),
            ];
            const allPlayersAvailable = matchPlayerIds.every((playerId) => !playersInActiveMatches.has(playerId));
            if (!allPlayersAvailable) {
                continue;
            }
            let courtToUse = null;
            if (pendingMatch.courtId !== null) {
                const assignedCourt = availableCourts.find(c => c.id === pendingMatch.courtId);
                if (assignedCourt && availableCourtIds.has(assignedCourt.id)) {
                    courtToUse = assignedCourt;
                }
                else {
                    continue;
                }
            }
            else {
                if (availableCourtId !== null && availableCourtIds.has(availableCourtId)) {
                    courtToUse = availableCourts.find(c => c.id === availableCourtId) || null;
                }
                if (!courtToUse && availableCourts.length > 0) {
                    courtToUse = availableCourts.find(c => availableCourtIds.has(c.id)) || null;
                }
            }
            if (courtToUse) {
                pendingMatch.status = queue_match_entity_1.QueueMatchStatus.ACTIVE;
                pendingMatch.courtId = courtToUse.id;
                pendingMatch.courtName = courtToUse.name;
                pendingMatch.startedAt = new Date();
                await this.queueMatchesRepository.save(pendingMatch);
                await this.queueingCourtsRepository.update(courtToUse.id, {
                    status: queueing_court_entity_1.QueueingCourtStatus.OCCUPIED,
                });
                availableCourtIds.delete(courtToUse.id);
                await this.updatePlayersStatus([pendingMatch], 'In Match');
                matchPlayerIds.forEach((id) => playersInActiveMatches.add(id));
            }
        }
    }
    async cancelMatch(id, userId) {
        const match = await this.queueMatchesRepository.findOne({ where: { id, userId } });
        if (!match) {
            throw new common_1.NotFoundException('Match not found.');
        }
        if (match.status !== queue_match_entity_1.QueueMatchStatus.ACTIVE &&
            match.status !== queue_match_entity_1.QueueMatchStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending or active matches can be cancelled.');
        }
        const wasActive = match.status === queue_match_entity_1.QueueMatchStatus.ACTIVE;
        const freedPlayerIds = new Set([
            ...match.teamA.map((player) => player.id),
            ...match.teamB.map((player) => player.id),
        ]);
        const freedCourtId = match.courtId;
        match.status = queue_match_entity_1.QueueMatchStatus.CANCELLED;
        match.completedAt = new Date();
        await this.queueMatchesRepository.save(match);
        if (match.courtId) {
            await this.queueingCourtsRepository.update(match.courtId, {
                status: queueing_court_entity_1.QueueingCourtStatus.AVAILABLE,
            });
        }
        await this.resetPlayersFromMatch(match, false);
        if (wasActive && freedCourtId) {
            await this.activatePendingMatches(freedPlayerIds, freedCourtId, userId);
        }
        return match;
    }
    async clearPendingMatches(userId) {
        const pendingMatches = await this.queueMatchesRepository.find({
            where: { status: queue_match_entity_1.QueueMatchStatus.PENDING, userId },
        });
        if (!pendingMatches.length) {
            return { cleared: 0 };
        }
        await Promise.all(pendingMatches.map((match) => this.resetPlayersFromMatch(match, false)));
        const pendingIds = pendingMatches.map((match) => match.id);
        await this.queueMatchesRepository.delete(pendingIds);
        return { cleared: pendingIds.length };
    }
    async resetExistingMatches() {
        const existing = await this.queueMatchesRepository.find({
            where: {
                status: (0, typeorm_2.In)([queue_match_entity_1.QueueMatchStatus.ACTIVE, queue_match_entity_1.QueueMatchStatus.PENDING]),
            },
        });
        if (existing.length === 0) {
            return;
        }
        const courtIds = existing
            .filter((match) => match.courtId)
            .map((match) => match.courtId);
        if (courtIds.length > 0) {
            await this.queueingCourtsRepository.update({ id: (0, typeorm_2.In)(courtIds) }, { status: queueing_court_entity_1.QueueingCourtStatus.AVAILABLE });
        }
        const playerIds = new Set();
        existing.forEach((match) => {
            [...match.teamA, ...match.teamB].forEach((player) => playerIds.add(player.id));
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
    async resetPlayersFromMatch(match, incrementGamesPlayed) {
        const playerIds = [
            ...match.teamA.map((player) => player.id),
            ...match.teamB.map((player) => player.id),
        ];
        const activeOrPendingMatches = await this.queueMatchesRepository.find({
            where: {
                status: (0, typeorm_2.In)([queue_match_entity_1.QueueMatchStatus.ACTIVE, queue_match_entity_1.QueueMatchStatus.PENDING]),
                userId: match.userId,
            },
        });
        const playersInActiveMatches = new Set();
        const playersInPendingMatches = new Set();
        activeOrPendingMatches.forEach((m) => {
            const playerIdsInMatch = [...m.teamA, ...m.teamB].map((p) => p.id);
            playerIdsInMatch.forEach((playerId) => {
                if (m.status === queue_match_entity_1.QueueMatchStatus.ACTIVE) {
                    playersInActiveMatches.add(playerId);
                }
                else if (m.status === queue_match_entity_1.QueueMatchStatus.PENDING) {
                    playersInPendingMatches.add(playerId);
                }
            });
        });
        const today = new Date();
        const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        localToday.setHours(0, 0, 0, 0);
        for (const playerId of playerIds) {
            const newStatus = playersInActiveMatches.has(playerId)
                ? 'In Match'
                : playersInPendingMatches.has(playerId)
                    ? 'Waiting'
                    : 'In Queue';
            const updateData = {
                status: newStatus,
                lastPlayed: localToday,
                ...(incrementGamesPlayed
                    ? {
                        gamesPlayed: () => 'games_played + 1',
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
    async updatePlayersStatus(matches, status, options) {
        const playerIds = new Set();
        if (options?.specificPlayerIds) {
            options.specificPlayerIds.forEach((id) => playerIds.add(id));
        }
        else {
            if (!matches.length) {
                return;
            }
            matches.forEach((match) => {
                [...match.teamA, ...match.teamB].forEach((player) => playerIds.add(player.id));
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
    toISODate(date) {
        if (!date)
            return null;
        if (typeof date === 'string') {
            return date.slice(0, 10);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    getTodayISODate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    getTodayDateRange() {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        return { startOfDay, endOfDay };
    }
    isEligibleForGameType(sex, gameType) {
        if (gameType === queue_match_entity_1.QueueMatchGameType.MENS_DOUBLES) {
            return sex === 'male';
        }
        if (gameType === queue_match_entity_1.QueueMatchGameType.WOMENS_DOUBLES) {
            return sex === 'female';
        }
        return true;
    }
    buildTeams(players, gameType, disallowedTeamSignatures, playersInActiveMatches = new Set()) {
        if (gameType === queue_match_entity_1.QueueMatchGameType.MIXED_DOUBLES) {
            return this.buildMixedTeams(players, disallowedTeamSignatures, playersInActiveMatches);
        }
        return this.buildSameSexTeams(players, disallowedTeamSignatures, playersInActiveMatches);
    }
    buildSameSexTeams(players, disallowedTeamSignatures, playersInActiveMatches = new Set()) {
        if (players.length < 2) {
            return [];
        }
        const combinations = this.buildPlayerCombinations(players);
        const teams = [];
        combinations.forEach((combo) => {
            if (disallowedTeamSignatures.has(combo.signature)) {
                return;
            }
            const team = combo.players.map((player) => this.toMatchPlayer(player));
            disallowedTeamSignatures.add(combo.signature);
            teams.push(team);
        });
        return teams;
    }
    buildMixedTeams(players, disallowedTeamSignatures, playersInActiveMatches = new Set()) {
        const males = players.filter((player) => player.sex === 'male');
        const females = players.filter((player) => player.sex === 'female');
        if (!males.length || !females.length) {
            return [];
        }
        const combos = [];
        males.forEach((male) => {
            females.forEach((female) => {
                combos.push({
                    players: [male, female],
                    diff: Math.abs(this.skillPriority[male.skill] - this.skillPriority[female.skill]),
                    random: Math.random(),
                    signature: this.getPlayerPairSignatureFromPlayers(male, female),
                });
            });
        });
        combos.sort((a, b) => a.diff - b.diff || a.random - b.random);
        const teams = [];
        combos.forEach((combo) => {
            if (disallowedTeamSignatures.has(combo.signature)) {
                return;
            }
            const team = combo.players.map((player) => this.toMatchPlayer(player));
            disallowedTeamSignatures.add(combo.signature);
            teams.push(team);
        });
        return teams;
    }
    buildMatchesFromTeams(teams, playersInActiveMatches = new Set()) {
        const teamsSharePlayers = (team1, team2) => {
            const team1Ids = new Set(team1.map(p => p.id));
            return team2.some(p => team1Ids.has(p.id));
        };
        const calculateSkillScore = (team1, team2) => {
            const team1Skills = team1.map(p => this.skillPriority[p.skill]);
            const team2Skills = team2.map(p => this.skillPriority[p.skill]);
            const avg1 = team1Skills.reduce((a, b) => a + b, 0) / team1Skills.length;
            const avg2 = team2Skills.reduce((a, b) => a + b, 0) / team2Skills.length;
            return Math.abs(avg1 - avg2);
        };
        const validMatches = [];
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const teamA = teams[i];
                const teamB = teams[j];
                if (!teamsSharePlayers(teamA, teamB)) {
                    const playerIds = new Set();
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
        validMatches.sort((a, b) => a.score - b.score);
        const selectedMatches = [];
        const usedPlayerIds = new Set();
        for (const match of validMatches) {
            const hasUsedPlayer = Array.from(match.playerIds).some(id => usedPlayerIds.has(id) && !playersInActiveMatches.has(id));
            if (!hasUsedPlayer) {
                selectedMatches.push({ teamA: match.teamA, teamB: match.teamB });
                match.playerIds.forEach(id => {
                    if (!playersInActiveMatches.has(id)) {
                        usedPlayerIds.add(id);
                    }
                });
            }
        }
        return selectedMatches;
    }
    getTeamSignature(team) {
        return [...team]
            .map((player) => player.skill)
            .sort()
            .join('|');
    }
    getPlayerPairSignatureFromPlayers(playerA, playerB) {
        return [playerA.id, playerB.id].sort((a, b) => a - b).join('-');
    }
    buildPlayerCombinations(players) {
        const combos = [];
        for (let i = 0; i < players.length; i += 1) {
            for (let j = i + 1; j < players.length; j += 1) {
                const first = players[i];
                const second = players[j];
                combos.push({
                    players: [first, second],
                    diff: Math.abs(this.skillPriority[first.skill] - this.skillPriority[second.skill]),
                    random: Math.random(),
                    signature: this.getPlayerPairSignatureFromPlayers(first, second),
                });
            }
        }
        combos.sort((a, b) => a.diff - b.diff || a.random - b.random);
        return combos;
    }
    getTeamMembersIdSignature(team) {
        return [...team]
            .map((player) => player.id)
            .sort((a, b) => a - b)
            .join('-');
    }
    async findHistory(userId) {
        return this.queueMatchesHistoryRepository.find({
            where: { userId },
            order: {
                archivedAt: 'DESC',
                createdAt: 'DESC',
            },
        });
    }
    matchHasBusyPlayer(payload, busyPlayerIds) {
        return [...payload.teamA, ...payload.teamB].some((player) => busyPlayerIds.has(player.id));
    }
    toMatchPlayer(player) {
        return {
            id: player.id,
            name: player.name,
            sex: player.sex,
            skill: player.skill,
        };
    }
};
exports.QueueMatchesService = QueueMatchesService;
exports.QueueMatchesService = QueueMatchesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(queue_match_entity_1.QueueMatch)),
    __param(1, (0, typeorm_1.InjectRepository)(queue_match_history_entity_1.QueueMatchHistory)),
    __param(2, (0, typeorm_1.InjectRepository)(queue_player_entity_1.QueuePlayer)),
    __param(3, (0, typeorm_1.InjectRepository)(queueing_court_entity_1.QueueingCourt)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], QueueMatchesService);
//# sourceMappingURL=queue-matches.service.js.map