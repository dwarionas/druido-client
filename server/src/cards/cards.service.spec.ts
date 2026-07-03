import { NotFoundException } from '@nestjs/common';
import { CardsService } from './cards.service';

describe('CardsService', () => {
    let service: CardsService;
    let prisma: any;
    let statsService: any;

    beforeEach(() => {
        prisma = {
            card: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                count: jest.fn(),
                create: jest.fn(),
                createMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                deleteMany: jest.fn(),
            },
            deck: {
                findFirst: jest.fn(),
                count: jest.fn(),
            },
        };
        statsService = { recordReview: jest.fn() };
        service = new CardsService(prisma, statsService);
    });

    describe('create', () => {
        it('throws when the deck does not belong to the user', async () => {
            prisma.deck.findFirst.mockResolvedValue(null);

            await expect(
                service.create('user-1', { deckId: 'deck-1', question: 'Q', answer: 'A' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('creates a card with a fresh FSRS state', async () => {
            prisma.deck.findFirst.mockResolvedValue({ id: 'deck-1', userId: 'user-1' });
            prisma.card.create.mockImplementation(({ data }: any) => Promise.resolve(data));

            const card = await service.create('user-1', {
                deckId: 'deck-1',
                question: 'die Katze',
                answer: 'кіт',
            });

            expect(card.state).toBe(0); // State.New
            expect(card.reps).toBe(0);
            expect(card.lapses).toBe(0);
            expect(card.due.getTime()).toBeLessThanOrEqual(Date.now());
        });
    });

    describe('list', () => {
        it('returns items together with the total count', async () => {
            prisma.card.findMany.mockResolvedValue([{ id: 'c1' }]);
            prisma.card.count.mockResolvedValue(120);

            const result = await service.list('user-1', 'deck-1');

            expect(result).toEqual({ items: [{ id: 'c1' }], total: 120 });
            expect(prisma.card.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 50, skip: 0 }),
            );
        });
    });

    describe('getDueCards', () => {
        it('scopes to a deck when deckId is given', async () => {
            prisma.card.findMany.mockResolvedValue([]);

            await service.getDueCards('user-1', 'deck-1');

            const where = prisma.card.findMany.mock.calls[0][0].where;
            expect(where.deckId).toBe('deck-1');
        });

        it('spans all decks when deckId is omitted', async () => {
            prisma.card.findMany.mockResolvedValue([]);

            await service.getDueCards('user-1');

            const where = prisma.card.findMany.mock.calls[0][0].where;
            expect(where.deckId).toBeUndefined();
            expect(where.userId).toBe('user-1');
        });
    });

    describe('review', () => {
        const newCard = {
            id: 'c1',
            userId: 'user-1',
            due: new Date(),
            stability: null,
            difficulty: null,
            elapsedDays: 0,
            scheduledDays: 0,
            reps: 0,
            lapses: 0,
            state: 0,
            lastReviewedAt: null,
        };

        it('advances the FSRS state and records the review', async () => {
            prisma.card.findFirst.mockResolvedValue(newCard);
            prisma.card.update.mockImplementation(({ data }: any) => Promise.resolve({ ...newCard, ...data }));

            const result = await service.review('user-1', 'c1', { rating: 3 });

            expect(result.card.state).not.toBe(0);
            expect(result.card.reps).toBe(1);
            expect(result.card.due.getTime()).toBeGreaterThan(Date.now());
            expect(statsService.recordReview).toHaveBeenCalledWith('user-1', 10);
        });

        it('returns a humanized schedule preview for all four ratings', async () => {
            prisma.card.findFirst.mockResolvedValue(newCard);
            prisma.card.update.mockImplementation(({ data }: any) => Promise.resolve({ ...newCard, ...data }));

            const result = await service.review('user-1', 'c1', { rating: 3 });

            expect(Object.keys(result.schedule)).toEqual(['1', '2', '3', '4']);
            for (const value of Object.values(result.schedule)) {
                expect(value).toMatch(/^\d+(mo|d|h|m|s)$/);
            }
        });

        it('awards more XP for an easy rating than for again', async () => {
            prisma.card.findFirst.mockResolvedValue(newCard);
            prisma.card.update.mockImplementation(({ data }: any) => Promise.resolve({ ...newCard, ...data }));

            await service.review('user-1', 'c1', { rating: 4 });
            await service.review('user-1', 'c1', { rating: 1 });

            expect(statsService.recordReview).toHaveBeenNthCalledWith(1, 'user-1', 15);
            expect(statsService.recordReview).toHaveBeenNthCalledWith(2, 'user-1', 5);
        });
    });

    describe('bulkCreate', () => {
        it('rejects when one of the decks belongs to someone else', async () => {
            prisma.deck.count.mockResolvedValue(1);

            await expect(
                service.bulkCreate('user-1', {
                    cards: [
                        { deckId: 'mine', question: 'Q1', answer: 'A1' },
                        { deckId: 'not-mine', question: 'Q2', answer: 'A2' },
                    ],
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
