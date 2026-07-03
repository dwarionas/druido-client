import { Injectable, NotFoundException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto, UpdateDeckDto } from './dto/deck.dto';

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
}
