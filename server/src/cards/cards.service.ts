import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatsService } from '../stats/stats.service';
import { CreateCardDto, UpdateCardDto, ReviewCardDto } from './dto/card.dto';
import { BulkCreateCardsDto } from './dto/cards-bulk.dto';
import {
    createEmptyCard,
    fsrs,
    generatorParameters,
    Rating,
    type Card as FSRSCard,
    State,
    type Grade,
    type RecordLogItem,
    type IPreview,
} from 'ts-fsrs';

const FSRS_PARAMS = generatorParameters({
    request_retention: 0.9,
    maximum_interval: 420,
    enable_fuzz: false,
    enable_short_term: true,
});

const f = fsrs(FSRS_PARAMS);

@Injectable()
export class CardsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly statsService: StatsService,
    ) { }

    async list(userId: string, deckId?: string, q?: string, tag?: string, skip?: number, take?: number) {
        const where: any = { userId };

        if (deckId) {
            where.deckId = deckId;
        }

        if (q) {
            where.OR = [
                { question: { contains: q, mode: 'insensitive' } },
                { answer: { contains: q, mode: 'insensitive' } },
                { notes: { contains: q, mode: 'insensitive' } },
            ];
        }

        if (tag) {
            where.tags = { has: tag };
        }

        const [items, total] = await Promise.all([
            this.prisma.card.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip: skip ? Number(skip) : 0,
                take: take ? Number(take) : 50,
            }),
            this.prisma.card.count({ where }),
        ]);

        return { items, total };
    }

    async getDueCards(userId: string, deckId?: string) {
        return this.prisma.card.findMany({
            where: {
                userId,
                ...(deckId && { deckId }),
                due: { lte: new Date() },
            },
            orderBy: { due: 'asc' },
            take: 100, // limit to 100 cards at once for performance
        });
    }

    async findOne(userId: string, id: string) {
        const card = await this.prisma.card.findFirst({
            where: { id, userId },
        });

        if (!card) {
            throw new NotFoundException('Card not found');
        }

        return card;
    }

    async create(userId: string, dto: CreateCardDto) {
        const deck = await this.prisma.deck.findFirst({
            where: { id: dto.deckId, userId },
        });

        if (!deck) {
            throw new NotFoundException('Deck not found');
        }

        const emptyCard = createEmptyCard(new Date());

        return this.prisma.card.create({
            data: {
                userId,
                deckId: dto.deckId,
                question: dto.question,
                answer: dto.answer,
                notes: dto.notes,
                tags: dto.tags || [],
                stability: emptyCard.stability,
                difficulty: emptyCard.difficulty,
                elapsedDays: emptyCard.elapsed_days,
                scheduledDays: emptyCard.scheduled_days,
                reps: emptyCard.reps,
                lapses: emptyCard.lapses,
                state: emptyCard.state as number,
                due: emptyCard.due,
            },
        });
    }

    async bulkCreate(userId: string, dto: BulkCreateCardsDto) {
        // Verify all decks exist and belong to user
        const deckIds = [...new Set(dto.cards.map((c) => c.deckId))];
        const decksCount = await this.prisma.deck.count({
            where: {
                id: { in: deckIds },
                userId,
            },
        });

        if (decksCount !== deckIds.length) {
            throw new NotFoundException('One or more decks were not found');
        }

        const emptyCard = createEmptyCard(new Date());

        const data = dto.cards.map((c) => ({
            userId,
            deckId: c.deckId,
            question: c.question,
            answer: c.answer,
            notes: c.notes,
            tags: c.tags || [],
            stability: emptyCard.stability,
            difficulty: emptyCard.difficulty,
            elapsedDays: emptyCard.elapsed_days,
            scheduledDays: emptyCard.scheduled_days,
            reps: emptyCard.reps,
            lapses: emptyCard.lapses,
            state: emptyCard.state as number,
            due: emptyCard.due,
        }));

        const result = await this.prisma.card.createMany({
            data,
        });

        return { count: result.count };
    }

    async update(userId: string, id: string, dto: UpdateCardDto) {
        const card = await this.prisma.card.findFirst({
            where: { id, userId },
        });

        if (!card) {
            throw new NotFoundException('Card not found');
        }

        return this.prisma.card.update({
            where: { id },
            data: {
                question: dto.question,
                answer: dto.answer,
                notes: dto.notes,
                tags: dto.tags,
            },
        });
    }

    async review(userId: string, id: string, dto: ReviewCardDto) {
        const card = await this.findOne(userId, id);

        const fsrsCard = this.dbCardToFsrs(card);

        const now = new Date();
        const scheduling = f.repeat(fsrsCard, now);
        const rating = dto.rating as Grade;
        const result: RecordLogItem = scheduling[rating];

        const updatedCard = await this.prisma.card.update({
            where: { id },
            data: {
                stability: result.card.stability,
                difficulty: result.card.difficulty,
                elapsedDays: result.card.elapsed_days,
                scheduledDays: result.card.scheduled_days,
                reps: result.card.reps,
                lapses: result.card.lapses,
                state: result.card.state as number,
                due: result.card.due,
                lastReviewedAt: now,
            },
        });

        const preview = this.buildSchedulePreview(scheduling, now);

        const xpMap: Record<number, number> = { 1: 5, 2: 8, 3: 10, 4: 15 };
        const xpEarned = xpMap[dto.rating] ?? 10;
        await this.statsService.recordReview(userId, xpEarned);

        return {
            card: updatedCard,
            schedule: preview,
        };
    }

    async getSchedulePreview(userId: string, id: string) {
        const card = await this.findOne(userId, id);

        const fsrsCard = this.dbCardToFsrs(card);
        const now = new Date();
        const scheduling = f.repeat(fsrsCard, now);

        return this.buildSchedulePreview(scheduling, now);
    }

    async remove(userId: string, id: string) {
        const card = await this.prisma.card.findFirst({
            where: { id, userId },
        });

        if (!card) {
            throw new NotFoundException('Card not found');
        }

        await this.prisma.card.delete({ where: { id } });
    }

    async bulkDelete(userId: string, deckId: string) {
        await this.prisma.card.deleteMany({
            where: { userId, deckId },
        });
    }

    private dbCardToFsrs(card: {
        due: Date;
        stability: number | null;
        difficulty: number | null;
        elapsedDays: number;
        scheduledDays: number;
        reps: number;
        lapses: number;
        state: number;
        lastReviewedAt: Date | null;
    }): FSRSCard {
        const empty = createEmptyCard(new Date());
        return {
            ...empty,
            due: card.due,
            stability: card.stability ?? 0,
            difficulty: card.difficulty ?? 0,
            elapsed_days: card.elapsedDays,
            scheduled_days: card.scheduledDays,
            reps: card.reps,
            lapses: card.lapses,
            state: card.state as State,
            last_review: card.lastReviewedAt ?? undefined,
        };
    }

    private buildSchedulePreview(
        scheduling: IPreview,
        now: Date,
    ): Record<number, string> {
        const preview: Record<number, string> = {};
        const grades: Grade[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];

        for (const r of grades) {
            const s: RecordLogItem = scheduling[r];
            if (s) {
                const seconds = (new Date(s.card.due).getTime() - now.getTime()) / 1000;
                preview[r as number] = this.humanizeSeconds(Math.ceil(seconds));
            }
        }

        return preview;
    }

    private humanizeSeconds(value: number): string {
        let s = Math.abs(value);
        const months = Math.floor(s / (30 * 24 * 3600));
        s %= 30 * 24 * 3600;
        const days = Math.floor(s / (24 * 3600));
        s %= 24 * 3600;
        const hours = Math.floor(s / 3600);
        s %= 3600;
        const minutes = Math.floor(s / 60);
        s = Math.floor(s % 60);

        const parts = [
            months ? `${months}mo` : '',
            days ? `${days}d` : '',
            hours ? `${hours}h` : '',
            minutes ? `${minutes}m` : '',
            !months && !days && !hours && !minutes ? `${s}s` : '',
        ].filter(Boolean);

        return parts[0] || '0s';
    }
}
