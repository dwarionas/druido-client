import { Injectable, NotFoundException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { randomBytes } from 'crypto';
import { createEmptyCard } from 'ts-fsrs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto, UpdateDeckDto } from './dto/deck.dto';

const SHARED_PREVIEW_LIMIT = 20;

@Injectable()
export class DecksService {
    constructor(private readonly prisma: PrismaService) { }

    async getAll(userId: string, q?: string) {
        const where: any = { userId };
        if (q) {
            where.name = { contains: q, mode: 'insensitive' };
        }

        return this.prisma.deck.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
        });
    }

    async summary(userId: string, q?: string) {
        const where: any = { userId };
        if (q) {
            where.name = { contains: q, mode: 'insensitive' };
        }

        const decks = await this.prisma.deck.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: { select: { cards: true } },
            },
        });

        const now = new Date();
        const dueCountsRaw = await this.prisma.card.groupBy({
            by: ['deckId'],
            where: {
                userId,
                deckId: { in: decks.map(d => d.id) },
                due: { lte: now }
            },
            _count: { id: true },
        });

        const dueCountMap = new Map(
            dueCountsRaw.map(item => [item.deckId, item._count.id])
        );

        return decks.map((deck) => ({
            id: deck.id,
            name: deck.name,
            description: deck.description,
            language: deck.language,
            tags: deck.tags,
            color: deck.color,
            totalCards: deck._count.cards,
            dueCards: dueCountMap.get(deck.id) || 0,
            createdAt: deck.createdAt,
            updatedAt: deck.updatedAt,
        }));
    }

    async findById(userId: string, id: string) {
        const deck = await this.prisma.deck.findFirst({
            where: { id, userId },
        });
        if (!deck) throw new NotFoundException();
        return deck;
    }

    async create(userId: string, dto: CreateDeckDto) {
        return this.prisma.deck.create({
            data: {
                userId,
                name: dto.name,
                description: dto.description,
                language: (dto.language as Language) || 'UK',
                tags: dto.tags || [],
                color: dto.color || 'yellow',
            },
        });
    }

    async update(userId: string, id: string, dto: UpdateDeckDto) {
        await this.findById(userId, id);

        return this.prisma.deck.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                tags: dto.tags,
                language: dto.language ? (dto.language as Language) : undefined,
                color: dto.color,
            },
        });
    }

    async delete(userId: string, id: string) {
        await this.findById(userId, id);
        await this.prisma.deck.delete({ where: { id } });
    }

    async setSharing(userId: string, id: string, isPublic: boolean) {
        const deck = await this.findById(userId, id);

        return this.prisma.deck.update({
            where: { id },
            data: {
                isPublic,
                // keep the same link when re-enabling sharing
                shareId: deck.shareId ?? randomBytes(6).toString('base64url'),
            },
        });
    }

    async getShared(shareId: string) {
        const deck = await this.prisma.deck.findFirst({
            where: { shareId, isPublic: true },
            include: {
                _count: { select: { cards: true } },
                cards: {
                    select: { question: true, answer: true, tags: true },
                    orderBy: { createdAt: 'asc' },
                    take: SHARED_PREVIEW_LIMIT,
                },
            },
        });

        if (!deck) {
            throw new NotFoundException('Shared deck not found');
        }

        return {
            shareId,
            name: deck.name,
            description: deck.description,
            language: deck.language,
            color: deck.color,
            totalCards: deck._count.cards,
            preview: deck.cards,
        };
    }

    async cloneShared(userId: string, shareId: string) {
        const source = await this.prisma.deck.findFirst({
            where: { shareId, isPublic: true },
            include: {
                cards: { select: { question: true, answer: true, notes: true, tags: true } },
            },
        });

        if (!source) {
            throw new NotFoundException('Shared deck not found');
        }

        const deck = await this.prisma.deck.create({
            data: {
                userId,
                name: source.name,
                description: source.description,
                language: source.language,
                tags: source.tags,
                color: source.color,
            },
        });

        // cloned cards start with a fresh FSRS state
        const emptyCard = createEmptyCard(new Date());
        await this.prisma.card.createMany({
            data: source.cards.map((c) => ({
                userId,
                deckId: deck.id,
                question: c.question,
                answer: c.answer,
                notes: c.notes,
                tags: c.tags,
                stability: emptyCard.stability,
                difficulty: emptyCard.difficulty,
                elapsedDays: emptyCard.elapsed_days,
                scheduledDays: emptyCard.scheduled_days,
                reps: emptyCard.reps,
                lapses: emptyCard.lapses,
                state: emptyCard.state as number,
                due: emptyCard.due,
            })),
        });

        return { deck, count: source.cards.length };
    }
}
