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

### 3. Update annual assets

Assets that typically change each year (in `angular-app/src/assets/`):
- Group draw images (`grupos_*.jpeg`, `grupos_aprendiz_*.jpeg`, `grupos_elite_*.jpeg`)
- Tournament banners/flyers

### 4. Check for dependency vulnerabilities

```bash
npm audit
cd angular-app && npm audit
```

After a year of inactivity, expect security advisories. Run `npm audit fix` for safe patches. Major upgrades (especially Angular) should be evaluated carefully.

### 5. Verify AWS resources are still active

The app connects directly to:
- DynamoDB table `Gladiadores` in `us-east-1`
- Cognito user/identity pools (IDs in `constants.ts`)
- S3 buckets for player photos

Confirm these haven't been deleted or had permissions changed during the off-season.

### 6. Smoke test

```bash
cd angular-app
ng serve
```

Visit http://localhost:4200 and verify:
- Home page loads
- Public pages (resultados, grupos, brackets) render data
- Login still works (Cognito)
- Admin/restricted area functions after login

## Tech Stack

- **Frontend:** Angular 15, Bootstrap 5, ng-bootstrap, MDB Angular
- **Backend:** No API server — the Angular app communicates directly with AWS services (DynamoDB, Cognito, S3) via the AWS SDK v3
- **Server:** Express (serves static files only)
- **Deployment:** AWS App Runner (Node.js 18)
