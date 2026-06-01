# Bestiarius

Web application for the Gladiadores Hoops basketball tournament.

## Prerequisites

- Node.js 18+
- npm
- Angular CLI (`npm install -g @angular/cli`)

## Project Structure

```
├── server.js              # Express static file server (production)
├── gulpfile.js            # Production build pipeline
├── webpack.config.cjs     # Bundles server.js for deployment
├── apprunner.yaml         # AWS App Runner deployment config
└── angular-app/           # Angular 15 SPA
    └── src/app/
        ├── aws-clients/   # DynamoDB, S3, Cognito clients
        ├── interfaces/    # TypeScript domain models
        ├── restricted-area/ # Admin pages
        └── results/       # Public tournament results
```

## Local Development

### 1. Install dependencies

```bash
# Root (Express server)
npm install

# Angular app
cd angular-app
npm install
```

### 2. Run the Angular dev server

```bash
cd angular-app
ng serve
```

This starts the app at **http://localhost:4200** with hot reload enabled. Changes to source files will automatically refresh the browser.

The dev server proxies API requests to `http://localhost:3080` (configured in `proxy.conf.json`).

### 3. Run the Express server (optional, for production-like setup)

In a separate terminal:

```bash
npm run dev
```

This runs the Express static server on port 3080 using nodemon (auto-restarts on changes).

### 4. Run both together (production-like)

Build the Angular app and serve it through Express:

```bash
cd angular-app
ng build
cd ..
npm run dev
```

Then visit **http://localhost:3080**.

## Common Commands

| Command | Location | Description |
|---------|----------|-------------|
| `ng serve` | `angular-app/` | Dev server with hot reload (port 4200) |
| `ng build` | `angular-app/` | Build Angular app to `dist/` |
| `ng test` | `angular-app/` | Run unit tests (Karma + Jasmine) |
| `ng generate component <name>` | `angular-app/` | Generate a new component |
| `npm run dev` | root | Express server with nodemon (port 3080) |
| `npm run build` | root | Full production build (webpack + gulp) |

## Production Build

```bash
npm run build
```

This runs webpack to bundle `server.js` and then the gulp pipeline which:
1. Cleans the `prod-build/` directory
2. Installs Angular dependencies
3. Builds the Angular app
4. Copies the Angular dist and bundled server into `prod-build/`
5. Zips everything into `angular-nodejs.zip`

## Deployment

The app deploys on AWS App Runner (see `apprunner.yaml`). The production start command is:

```bash
npm start   # runs node server.bundle.js on port 3080
```

## Annual Kickoff Checklist

This project is only actively developed ~2 months per year. When picking it back up:

### 1. Verify your environment

```bash
node --version   # Should be 18+
ng version       # Should match Angular 15.x CLI
```

If Node.js was upgraded since last year, delete `node_modules` and `package-lock.json` in both root and `angular-app/`, then reinstall:

```bash
rm -rf node_modules package-lock.json
npm install

cd angular-app
rm -rf node_modules package-lock.json
npm install
```

### 2. Update tournament-specific values

In `angular-app/src/app/aws-clients/constants.ts`:
- `TOURNAMENT_YEAR` — auto-derives from the current year, no change needed
- `TOURNAMENT_DAYS` — **must be updated** to the actual tournament dates each year

### 3. Rotate signup codes

Generate new signup codes and update them in DynamoDB (table `Gladiadores`). Each role has an entry:

```json
{
  "pk": "renew.code",
  "sk": "coach",
  "code": "<new-code>"
}
```

```json
{
  "pk": "renew.code",
  "sk": "scout",
  "code": "<new-code>"
}
```

Then distribute the new registration URLs:
- Coach: `https://www.gladiadoreshoops.com/#/signup?role=coach&code=<new-code>`
- Scout: `https://www.gladiadoreshoops.com/#/signup?role=scout&code=<new-code>`

Users with existing accounts use the login button on the signup page instead of re-registering.

### 4. Update annual assets

Assets that typically change each year (in `angular-app/src/assets/`):
- Group draw images (`grupos_*.jpeg`, `grupos_aprendiz_*.jpeg`, `grupos_elite_*.jpeg`)
- Tournament banners/flyers

### 5. Check for dependency vulnerabilities

```bash
npm audit
cd angular-app && npm audit
```

After a year of inactivity, expect security advisories. Run `npm audit fix` for safe patches. Major upgrades (especially Angular) should be evaluated carefully.

### 6. Verify AWS resources are still active

The app connects directly to:
- DynamoDB table `Gladiadores` in `us-east-1`
- Cognito user/identity pools (IDs in `constants.ts`)
- S3 buckets for player photos

Confirm these haven't been deleted or had permissions changed during the off-season.

### 7. Smoke test

```bash
cd angular-app
ng serve
```

Visit http://localhost:4200 and verify:
- Home page loads
- Public pages (resultados, grupos, brackets) render data
- Login still works (Cognito)
- Admin/restricted area functions after login

## DynamoDB Schema

Single table `Gladiadores` in `us-east-1`. All items use `pk` (partition key) and `sk` (sort key).

### Item Types

| Entity | PK | SK | Description |
|--------|----|----|-------------|
| Team | `team.{teamId}` | `team.data` | Team info (name, category, coach, location, payment status) |
| Player | `player.{playerId}` | `player.data` | Player info (name, position, birthday, height, etc.) |
| User | `{role}.{userId}` | `{role}.data` | User profile (coach, scout, or admin) |
| Match | `match.{matchId}` | `match.data` | Match info (teams, score, day, gym) |
| Gym | `gym.{gymId}` | `gym.data` | Gymnasium/venue info |
| Report | `{role}.{scoutId}` | `report.{year}.player.{playerId}` | Scout evaluation report |
| Award | `award.{awardId}` | `award.data` | Tournament awards and nominations |
| Feature Flags | `features` | `data` | Application feature toggles |
| Signup Code | `renew.code` | `{role}` | Registration codes (coach, scout) |

### Secondary Index Keys

| Key | Name | Usage |
|-----|------|-------|
| `spk` | Secondary partition key | Category (teams), `team.{id}` (players), `report` (reports) |
| `ssk` | Secondary sort key | CoachId (teams), year (reports), gymId (matches) |
| `cy` | Competition year | Tournament year for all items (e.g., `2025`) |

### Global Secondary Indexes

| Index | Keys | Purpose |
|-------|------|---------|
| MAIN_GSI | `spk` + `ssk` | Query by category+coach, team+player |
| LIST_GSI | `sk` + `cy` | List entities by type and year |
| SK_SPK | `sk` + `spk` | List by type filtered by secondary partition |
| SK_SSK | `sk` + `ssk` | List by type filtered by secondary sort |

## Tech Stack

- **Frontend:** Angular 15, Bootstrap 5, ng-bootstrap, MDB Angular
- **Backend:** No API server — the Angular app communicates directly with AWS services (DynamoDB, Cognito, S3) via the AWS SDK v3
- **Server:** Express (serves static files only)
- **Deployment:** AWS App Runner (Node.js 18)
