# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bestiarius is the web application for **Gladiadores Hoops**, a basketball tournament in Parral, Mexico. It consists of an Angular 15 frontend served by a Node.js/Express static file server, deployed on AWS App Runner.

## Architecture

**Two-layer structure:**
- **Root** (`/`) — Express server (`server.js`) that serves the built Angular app as static files on port 3080.
- **Angular app** (`angular-app/`) — The full SPA frontend (Angular 15, Bootstrap 5, ng-bootstrap, MDB Angular).

**AWS backend (accessed directly from the frontend via AWS SDK):**
- **DynamoDB** — Single table `Gladiadores` stores all data (teams, players, matches, evaluations, etc.)
- **Cognito** — Auth with both unauthenticated (public pages) and authenticated (admin/restricted area) identity pools
- **S3** — Asset storage (player photos, etc.)

There is no backend API — the Angular app talks directly to AWS services using the JS SDK v3 with Cognito credentials.

**Key directories in `angular-app/src/app/`:**
- `aws-clients/` — DynamoDB, S3, Cognito client wrappers and credential config
- `interfaces/` — TypeScript interfaces for domain models (player, team, match, gym, etc.)
- `restricted-area/` — Admin-only pages (match editor, evaluations, team/player management)
- `results/` — Public tournament results (brackets, groups, standings, scoreboards)

## Build & Dev Commands

### Development (Angular frontend)
```bash
cd angular-app
npm install
npm start          # ng serve on port 4200, proxies / to localhost:3080
```

### Development (Express server)
```bash
npm install
npm run dev        # nodemon on port 3080
```

### Production build
```bash
npm run build      # webpack bundles server.js + gulp builds Angular and zips for deployment
```
The gulp pipeline: cleans `prod-build/`, installs Angular deps, builds Angular, copies dist + bundled server, zips into `angular-nodejs.zip`.

### Tests
```bash
cd angular-app
npm test           # karma + jasmine
```

## Deployment

Deployed via AWS App Runner (`apprunner.yaml`). Runtime: Node.js 18. The build phase installs Angular CLI, webpack, and gulp globally, then runs `npm run build`. The start command runs `npm start` (which runs `node server.bundle.js`).

## Key Constants

Located in `angular-app/src/app/aws-clients/constants.ts`:
- `DDB_TABLE_NAME`: `Gladiadores`
- `REGION`: `us-east-1`
- `TOURNAMENT_YEAR`: derived from current year
- `TOURNAMENT_DAYS`: array of tournament day numbers

## Language

The UI and much of the codebase uses Spanish naming (partidos = matches, torneo = tournament, evaluacion = evaluation, inicio = home, patrocinios = sponsors, etc.).
