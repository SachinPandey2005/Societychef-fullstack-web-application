# HomeChef Backend

This is the Node.js / Express backend for the HomeChef (Society Chef) application.

## Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase Project (for Postgres + Auth)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env` and fill in the required values.
   ```bash
   cp .env.example .env
   ```

## Scripts

- `npm run dev`: Starts the development server with hot-reloading (nodemon/tsx).
- `npm run build`: Compiles TypeScript to JavaScript in the `dist/` directory.
- `npm start`: Runs the compiled production code.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run format`: Formats code using Prettier.
- `npm test`: Runs the test suite (placeholder).

## Architecture
- `src/app.ts`: Express application setup & middleware.
- `src/server.ts`: Entry point.
- `src/config/`: Environment and third-party initializations.
- `src/utils/`: Helpers for responses, async handling, and errors.
