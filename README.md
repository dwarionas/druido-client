# Druido

[![CI](https://github.com/dwarionas/druido-client/actions/workflows/ci.yml/badge.svg)](https://github.com/dwarionas/druido-client/actions/workflows/ci.yml)

Spaced repetition app for language learners. Uses the [FSRS](https://github.com/open-spaced-repetition/ts-fsrs) scheduling algorithm instead of the traditional SM-2 approach, providing more accurate review intervals based on individual memory patterns.

## Demo

The fastest way to try it:

```bash
docker compose up -d
cd server && cp .env.example .env && npm i && npx prisma migrate dev && npm run start:dev
cd client && npm i && npm run dev
```

Open `http://localhost:8000` and click **Try Demo** — a pre-seeded deck with 900+ Ukrainian→German flashcards will be created automatically. Registration is also available if you want your own account.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | NestJS 11, Prisma 6, PostgreSQL 16 |
| Auth | Passport JWT, cookie-based sessions, bcrypt |
| SRS Engine | ts-fsrs (FSRS v5) on both client preview and server persistence |
| Testing | Jest (server), Vitest + Testing Library (client), GitHub Actions CI |
| Infra | Docker Compose |

## Features

- FSRS-based spaced repetition with real-time schedule preview
- Review across all decks at once or per deck
- Keyboard shortcuts during review (Space to flip, 1–4 to rate)
- Deck management with color coding, tag filtering and pagination
- Public deck sharing — anyone with the link can preview a deck and clone it with a fresh learning state
- CSV and Anki (.apkg) import/export
- Global search across decks and cards
- Activity heatmap, daily review charts, per-deck mastery tracking
- Achievement system (streaks, XP milestones, deck mastery)
- Full authentication plus a one-click shared demo account
- i18n support (Ukrainian, English, German)
- Light and dark themes

## Tests

```bash
cd server && npm test    # services: FSRS review flow, streaks, sharing, auth
cd client && npm test    # CSV parser, achievements, components
```

Both suites plus typecheck and build run in CI on every push.

## Architecture

```
druido/
├── client/             Next.js frontend
│   ├── app/            Pages and layouts (App Router)
│   ├── components/     UI components (shadcn + custom)
│   ├── hooks/          useAuth, useFSRS
│   └── lib/            API client, i18n, CSV/APKG parsers, utils
├── server/             NestJS backend
│   ├── src/
│   │   ├── auth/       JWT auth (register, login, demo mode)
│   │   ├── decks/      Deck CRUD + public sharing
│   │   ├── cards/      Card CRUD + FSRS scheduling
│   │   └── stats/      Review tracking, heatmap, streaks
│   └── prisma/         Schema, migrations, demo seed
└── docker-compose.yml  PostgreSQL
```

## License

MIT
