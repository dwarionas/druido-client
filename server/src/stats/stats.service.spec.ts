import { StatsService } from './stats.service';

function daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

describe('StatsService', () => {
    let service: StatsService;
    let prisma: any;

    beforeEach(() => {
        prisma = {
            user: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            studySession: {
                upsert: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
            },
            deck: {
                count: jest.fn(),
                findMany: jest.fn(),
            },
            card: {
                count: jest.fn(),
                groupBy: jest.fn(),
            },
        };
        service = new StatsService(prisma);
    });

    describe('recordReview streak logic', () => {
        async function recordWithLastStudied(lastStudiedAt: Date | null, streak: number) {
            prisma.user.findUnique.mockResolvedValue({ streak, lastStudiedAt });
            await service.recordReview('user-1', 10);
            return prisma.user.update.mock.calls[0][0].data.streak;
        }

        it('starts a streak of 1 for a first-time learner', async () => {
            expect(await recordWithLastStudied(null, 0)).toBe(1);
        });

        it('keeps the streak when already studied today', async () => {
            expect(await recordWithLastStudied(new Date(), 5)).toBe(5);
        });

        it('extends the streak when last studied yesterday', async () => {
            expect(await recordWithLastStudied(daysAgo(1), 5)).toBe(6);
        });

        it('resets the streak after a missed day', async () => {
            expect(await recordWithLastStudied(daysAgo(3), 5)).toBe(1);
        });

        it('increments xp and the daily session counter', async () => {
            prisma.user.findUnique.mockResolvedValue({ streak: 0, lastStudiedAt: null });

            await service.recordReview('user-1', 15);

            expect(prisma.studySession.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    update: { cardsReviewed: { increment: 1 }, xpEarned: { increment: 15 } },
                }),
            );
            expect(prisma.user.update.mock.calls[0][0].data.xp).toEqual({ increment: 15 });
        });
    });

    describe('getDeckStats', () => {
        it('aggregates card states per deck from a single groupBy', async () => {
            prisma.deck.findMany.mockResolvedValue([
                { id: 'd1', name: 'Deutsch' },
                { id: 'd2', name: 'Empty' },
            ]);
            prisma.card.groupBy.mockResolvedValue([
                { deckId: 'd1', state: 0, _count: { id: 3 } },
                { deckId: 'd1', state: 2, _count: { id: 7 } },
            ]);

            const stats = await service.getDeckStats('user-1');

            expect(stats).toEqual([
                { deckId: 'd1', deckName: 'Deutsch', total: 10, mature: 7, learning: 0, new: 3, masteryPercent: 70 },
                { deckId: 'd2', deckName: 'Empty', total: 0, mature: 0, learning: 0, new: 0, masteryPercent: 0 },
            ]);
        });
    });
});
