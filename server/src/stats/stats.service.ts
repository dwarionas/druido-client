import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
    constructor(private readonly prisma: PrismaService) { }

    async getOverview(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true, streak: true, dailyGoal: true, lastStudiedAt: true, createdAt: true },
        });

        const [totalDecks, totalCards, reviewedToday] = await Promise.all([
            this.prisma.deck.count({ where: { userId } }),
            this.prisma.card.count({ where: { userId } }),
            this.getReviewedToday(userId),
        ]);

        return {
            xp: user?.xp ?? 0,
            streak: user?.streak ?? 0,
            dailyGoal: user?.dailyGoal ?? 20,
            lastStudiedAt: user?.lastStudiedAt,
            memberSince: user?.createdAt,
            totalDecks,
            totalCards,
            reviewedToday,
        };
    }

    async getHeatmap(userId: string) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        oneYearAgo.setHours(0, 0, 0, 0);

        const sessions = await this.prisma.studySession.findMany({
            where: {
                userId,
                date: { gte: oneYearAgo },
            },
            select: { date: true, cardsReviewed: true },
            orderBy: { date: 'asc' },
        });

        const heatmap: Record<string, number> = {};
        for (const s of sessions) {
            const key = s.date.toISOString().split('T')[0];
            heatmap[key] = s.cardsReviewed;
        }

        return heatmap;
    }

    async getDaily(userId: string, days: number = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);

        const sessions = await this.prisma.studySession.findMany({
            where: {
                userId,
                date: { gte: since },
            },
            select: { date: true, cardsReviewed: true, xpEarned: true },
            orderBy: { date: 'asc' },
        });

        return sessions.map((s) => ({
            date: s.date.toISOString().split('T')[0],
            cardsReviewed: s.cardsReviewed,
            xpEarned: s.xpEarned,
        }));
    }

    async getDeckStats(userId: string) {
        const [decks, grouped] = await Promise.all([
            this.prisma.deck.findMany({
                where: { userId },
                select: { id: true, name: true },
            }),
            this.prisma.card.groupBy({
                by: ['deckId', 'state'],
                where: { userId },
                _count: { id: true },
            }),
        ]);

        const countsByDeck = new Map<string, Record<number, number>>();
        for (const g of grouped) {
            const counts = countsByDeck.get(g.deckId) ?? {};
            counts[g.state] = g._count.id;
            countsByDeck.set(g.deckId, counts);
        }

        return decks.map((deck) => {
            const counts = countsByDeck.get(deck.id) ?? {};
            const mature = counts[2] ?? 0;
            const learning = counts[1] ?? 0;
            const newCards = counts[0] ?? 0;
            const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

            return {
                deckId: deck.id,
                deckName: deck.name,
                total,
                mature,
                learning,
                new: newCards,
                masteryPercent: total > 0 ? Math.round((mature / total) * 100) : 0,
            };
        });
    }

    async recordReview(userId: string, xpEarned: number = 10) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await this.prisma.studySession.upsert({
            where: { userId_date: { userId, date: today } },
            create: { userId, date: today, cardsReviewed: 1, xpEarned },
            update: {
                cardsReviewed: { increment: 1 },
                xpEarned: { increment: xpEarned },
            },
        });

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { streak: true, lastStudiedAt: true },
        });

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        let newStreak = 1;
        if (user?.lastStudiedAt) {
            const lastDate = new Date(user.lastStudiedAt);
            lastDate.setHours(0, 0, 0, 0);

            if (lastDate.getTime() === today.getTime()) {
                newStreak = user.streak;
            } else if (lastDate.getTime() === yesterday.getTime()) {
                newStreak = user.streak + 1;
            }
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                xp: { increment: xpEarned },
                streak: newStreak,
                lastStudiedAt: new Date(),
            },
        });
    }

    private async getReviewedToday(userId: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const session = await this.prisma.studySession.findUnique({
            where: { userId_date: { userId, date: today } },
            select: { cardsReviewed: true },
        });

        return session?.cardsReviewed ?? 0;
    }
}
