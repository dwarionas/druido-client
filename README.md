## DRUIDO

Druido is an FSRS-based spaced repetition app (Anki-style) with:
- Landing page on the root domain (e.g. `druido.com`)
- Auth app on `login.druido.com`
- Main application on `app.druido.com`
- Backend API with MongoDB for users, decks and cards

### Monorepo structure

- Frontend (Next.js 16, App Router): root of this repo
- Backend (Express + MongoDB): `backend/`

### Environment variables

Frontend (`.env.local` in repo root):

- `NEXT_PUBLIC_API_URL=http://localhost:4000` (or your deployed backend URL, e.g. `https://api.your-domain.com`)

Backend (`backend/.env`):

- `PORT=4000`
- `MONGODB_URI=your-mongodb-connection-string` (e.g. from MongoDB Atlas)
- `JWT_SECRET=some-long-random-secret`
- `CLIENT_ORIGIN=http://localhost:8000` (for local dev), or your deployed frontend origin

### Local development

1. Install dependencies (frontend + backend):

```bash
cd druido-client
npm install
cd backend
npm install
```

2. Run backend:

```bash
cd backend
npm run dev
```

3. Run frontend (from repo root):

```bash
npm run dev
```

- Frontend: http://localhost:8000
- Backend: http://localhost:4000

### Deployment overview

#### Frontend (Next.js)

Recommended: deploy to Vercel.

- Create a new Vercel project from this repo
- Set `NEXT_PUBLIC_API_URL` in Vercel project settings to your deployed backend URL (e.g. `https://api.druido.com` or a Railway/Render URL)
- Point your apex domain `druido.com` and subdomains `login.druido.com`, `app.druido.com` at the same Vercel project using DNS records
- The existing `middleware.ts` will route:
  - `login.druido.com/*` → `/login/*`
  - `app.druido.com/*` → `/app/*`

#### Backend (Express API)

Recommended: deploy containerised backend to a platform like Railway/Render/Fly.io.

- Build Docker image using the `backend/` folder (or use plain Node.js environment)
- Set environment variables: `PORT`, `MONGODB_URI` (MongoDB Atlas), `JWT_SECRET`, `CLIENT_ORIGIN` (your frontend origin hosted on Vercel)
- Expose the backend over HTTPS, e.g. `https://api.druido.com` or platform-provided URL
- Update `NEXT_PUBLIC_API_URL` in the frontend environment to match this URL

#### MongoDB

- Create a MongoDB Atlas cluster
- Allow network access from your backend host (or `0.0.0.0/0` for quick testing)
- Create a database user and connection string
- Use this string as `MONGODB_URI` for the backend

After these are configured, you can:

- Register a new account on `login.druido.com`
- Log in and access `app.druido.com`
- Create decks and cards and review them with FSRS.
