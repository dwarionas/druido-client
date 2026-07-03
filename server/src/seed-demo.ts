import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';
import { createEmptyCard } from 'ts-fsrs';

export const DEMO_EMAIL = 'demo@druido.app';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME = 'Demo';
const BCRYPT_ROUNDS = 12;

interface RawCard {
    question: string;
    answer: string;
}

export async function seedDemoUser(prisma: PrismaClient) {
    const existing = await prisma.user.findUnique({
        where: { email: DEMO_EMAIL },
        include: { decks: true },
    });

    if (existing && existing.decks.length > 0) {
        return existing;
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

    const user = existing ?? await prisma.user.create({
        data: {
            email: DEMO_EMAIL,
            passwordHash,
            name: DEMO_NAME,
            xp: 1250,
            streak: 7,
            dailyGoal: 20,
            lastStudiedAt: new Date(),
        },
    });

    const deck = await prisma.deck.create({
        data: {
            userId: user.id,
            name: 'Deutsch B2–C1',
            description: 'Українсько-німецькі картки для рівнів B2–C1',
            language: 'DE',
            color: 'green',
            tags: ['deutsch', 'b2', 'c1', 'vocabulary'],
        },
    });

    const cardsPath = path.join(__dirname, '..', 'prisma', 'demo-cards.json');
    const raw: RawCard[] = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));
    const emptyCard = createEmptyCard(new Date());

    const data = raw.map((c) => ({
        userId: user.id,
        deckId: deck.id,
        question: c.question,
        answer: c.answer,
        tags: [],
        stability: emptyCard.stability,
        difficulty: emptyCard.difficulty,
        elapsedDays: emptyCard.elapsed_days,
        scheduledDays: emptyCard.scheduled_days,
        reps: emptyCard.reps,
        lapses: emptyCard.lapses,
        state: emptyCard.state as number,
        due: emptyCard.due,
    }));

    await prisma.card.createMany({ data });

    await seedStudySessions(prisma, user.id);

    return user;
}

async function seedStudySessions(prisma: PrismaClient, userId: string) {
    const sessions = [];
    const now = new Date();

    for (let i = 45; i >= 0; i--) {
        if (Math.random() < 0.3) continue;

        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const cardsReviewed = Math.floor(Math.random() * 25) + 5;
        const xpEarned = cardsReviewed * 10;

        sessions.push({
            userId,
            date,
            cardsReviewed,
            xpEarned,
        });
    }

    for (const session of sessions) {
        await prisma.studySession.upsert({
            where: { userId_date: { userId, date: session.date } },
            create: session,
            update: {},
        });
    }
}

export async function resetDemoUser(prisma: PrismaClient) {
    const user = await prisma.user.findUnique({
        where: { email: DEMO_EMAIL },
    });

    if (user) {
        await prisma.studySession.deleteMany({ where: { userId: user.id } });
        await prisma.card.deleteMany({ where: { userId: user.id } });
        await prisma.deck.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    }

    return seedDemoUser(prisma);
}

if (require.main === module) {
    const prisma = new PrismaClient();
    seedDemoUser(prisma)
        .then((user) => {
            console.log(`Demo user seeded: ${user.email} (${user.id})`);
        })
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
