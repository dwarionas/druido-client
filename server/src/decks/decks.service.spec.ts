import { NotFoundException } from '@nestjs/common';
import { DecksService } from './decks.service';

describe('DecksService', () => {
    let service: DecksService;
    let prisma: any;

    beforeEach(() => {
        prisma = {
            deck: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            card: {
                groupBy: jest.fn(),
                createMany: jest.fn(),
            },
        };
        service = new DecksService(prisma);
    });

    describe('findById', () => {
        it("throws when the deck doesn't belong to the user", async () => {
            prisma.deck.findFirst.mockResolvedValue(null);

            await expect(service.findById('user-1', 'deck-1')).rejects.toThrow(NotFoundException);
            expect(prisma.deck.findFirst).toHaveBeenCalledWith({
                where: { id: 'deck-1', userId: 'user-1' },
            });
        });
    });

    describe('create', () => {
        it('persists the chosen color', async () => {
            prisma.deck.create.mockImplementation(({ data }: any) => Promise.resolve(data));

            const deck = await service.create('user-1', { name: 'Deutsch', color: 'green' });

            expect(deck.color).toBe('green');
        });

        it('falls back to the default color', async () => {
            prisma.deck.create.mockImplementation(({ data }: any) => Promise.resolve(data));

            const deck = await service.create('user-1', { name: 'Deutsch' });

            expect(deck.color).toBe('yellow');
        });
    });

    describe('setSharing', () => {
        it('generates a shareId when sharing for the first time', async () => {
            prisma.deck.findFirst.mockResolvedValue({ id: 'deck-1', shareId: null });
            prisma.deck.update.mockImplementation(({ data }: any) => Promise.resolve(data));

            const result = await service.setSharing('user-1', 'deck-1', true);

            expect(result.isPublic).toBe(true);
            expect(result.shareId).toEqual(expect.any(String));
            expect(result.shareId).not.toHaveLength(0);
        });

        it('keeps the existing shareId so old links stay valid', async () => {
            prisma.deck.findFirst.mockResolvedValue({ id: 'deck-1', shareId: 'abc123' });
            prisma.deck.update.mockImplementation(({ data }: any) => Promise.resolve(data));

            const result = await service.setSharing('user-1', 'deck-1', false);

            expect(result.isPublic).toBe(false);
            expect(result.shareId).toBe('abc123');
        });
    });

    describe('getShared', () => {
        it('throws for an unknown or private deck', async () => {
            prisma.deck.findFirst.mockResolvedValue(null);

            await expect(service.getShared('nope')).rejects.toThrow(NotFoundException);
        });

        it('returns a limited public payload without FSRS state', async () => {
            prisma.deck.findFirst.mockResolvedValue({
                name: 'Deutsch B2',
                description: null,
                language: 'DE',
                color: 'green',
                _count: { cards: 900 },
                cards: [{ question: 'Q', answer: 'A', tags: [] }],
            });

            const result = await service.getShared('abc123');

            expect(result).toEqual({
                shareId: 'abc123',
                name: 'Deutsch B2',
                description: null,
                language: 'DE',
                color: 'green',
                totalCards: 900,
                preview: [{ question: 'Q', answer: 'A', tags: [] }],
            });
        });
    });

    describe('cloneShared', () => {
        it('copies deck and cards with a fresh FSRS state', async () => {
            prisma.deck.findFirst.mockResolvedValue({
                name: 'Deutsch B2',
                description: 'desc',
                language: 'DE',
                tags: ['b2'],
                color: 'green',
                cards: [
                    { question: 'Q1', answer: 'A1', notes: null, tags: [] },
                    { question: 'Q2', answer: 'A2', notes: null, tags: ['x'] },
                ],
            });
            prisma.deck.create.mockResolvedValue({ id: 'new-deck', name: 'Deutsch B2' });
            prisma.card.createMany.mockResolvedValue({ count: 2 });

            const result = await service.cloneShared('user-2', 'abc123');

            expect(result.count).toBe(2);
            const created = prisma.card.createMany.mock.calls[0][0].data;
            expect(created).toHaveLength(2);
            for (const card of created) {
                expect(card.userId).toBe('user-2');
                expect(card.deckId).toBe('new-deck');
                expect(card.state).toBe(0);
                expect(card.reps).toBe(0);
            }
        });

        it('throws when the deck is not shared', async () => {
            prisma.deck.findFirst.mockResolvedValue(null);

            await expect(service.cloneShared('user-2', 'nope')).rejects.toThrow(NotFoundException);
        });
    });
});
