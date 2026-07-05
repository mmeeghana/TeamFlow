# TeamFlow

Production-oriented full-stack monorepo scaffold for TeamFlow.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Recharts, FullCalendar, @dnd-kit
- Backend: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT, Multer, Nodemailer
- Tooling: ESLint, Prettier, npm workspaces

## Structure

```text
teamflow/
  frontend/      React + Vite app
  backend/       Express API + Prisma
```

## Getting Started

```bash
npm install
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
npm run dev
```

Run each app separately:

```bash
npm run dev:frontend
npm run dev:backend
```

## Scripts

- `npm run dev` starts all workspace development servers.
- `npm run build` builds all workspaces.
- `npm run lint` lints all workspaces.
- `npm run typecheck` runs TypeScript checks.
- `npm run format` formats the repository with Prettier.

## Database

Configure `DATABASE_URL` in `backend/.env`, then run:

```bash
npm run prisma:generate -w backend
npm run prisma:migrate -w backend
```

No product features are implemented yet. This repository only contains the project scaffold.
