# DECA Roleplay Generator

DECA Roleplay Generator is a beginner-friendly MVP web app for practicing DECA roleplays without needing any API key or external AI service.

The app runs in 2 phases:

1. Participant View
   It generates a DECA-style participant packet and shows only what a competitor should see.
2. Judge View
   After the student submits a written response, the app reveals judge-side scoring, follow-up questions, strengths, weaknesses, missed opportunities, and improvement suggestions.

## Stack

This project uses:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local JSON seed data for events and performance indicators
- Local offline generation and judging logic

Why this stack:

- It is modern but still beginner-friendly.
- It is easy to deploy to Vercel.
- It does not require accounts, databases, or API keys for the MVP.
- It is structured so an AI provider or a database can be added later without rewriting the whole app.

## What the MVP includes

- Landing page
- Practice page with filters for event, cluster, difficulty, optional industry, optional PIs, and PI count
- Participant-only packet generation
- Typed response submission
- Judge-side rubric-style evaluation after submission
- Local seed data for events, clusters, sample reference notes, and performance indicators
- Clean component structure for easy customization

## 1. Install dependencies

Make sure you have Node.js installed.

Recommended:

- Node.js 20 or newer

Then run:

```bash
npm install
```

## 2. Environment variables

For this offline MVP, no environment variables are required.

If you want to keep a local `.env` file for future upgrades, you can copy:

```bash
cp .env.example .env
```

But the current app works without adding anything to it.

## 3. Run locally

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## 4. Build for production

```bash
npm run build
npm run start
```

## 5. Deploy to Vercel

The app is already structured for a standard Vercel deployment.

### Option A: GitHub + Vercel

1. Push this project to GitHub.
2. Go to Vercel and import the repository.
3. Click Deploy.

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel
```

When prompted:

1. Link the project
2. Deploy

## 6. Files you will edit later to customize the app

### Local generation and judging logic

- `lib/offline-engine.ts`

This file controls:

- how participant packets are generated
- the scenario banks and wording pools
- how responses are judged locally
- how follow-up questions and score estimates are created

### App-wide settings

- `lib/config.ts`

This file controls:

- difficulty options
- participant instructions
- 21st century skills
- basic limits

### Event and PI seed data

- `data/events.json`
- `data/clusters.json`
- `data/performance-indicators.json`
- `data/roleplay-references.json`

This is where you replace the sample DECA data with your own.

### API routes

- `app/api/generate-roleplay/route.ts`
- `app/api/judge-roleplay/route.ts`

These files control the local server-side generation and judging flow.

## 7. How to replace the sample PI data later

Open:

- `data/performance-indicators.json`

Each PI looks like this:

```json
{
  "id": "pi-hrm-001",
  "code": "EI:009",
  "text": "Explain the concept of leadership.",
  "clusterId": "business-management",
  "instructionalArea": "Human Resources Management",
  "eventIds": ["hrm-series"]
}
```

You can:

- replace the sample entries with your own official PIs
- add more events
- attach PIs to one or more events
- update instructional areas

You can also add more tone/reference notes in:

- `data/roleplay-references.json`

## 8. How the app works

### Generation flow

1. User fills out the form on `/practice`
2. The app sends a request to `app/api/generate-roleplay/route.ts`
3. The server selects matching seed data
4. The local generator builds a participant-only packet from the event, difficulty, PI list, and scenario banks
5. The app displays only the participant-facing packet

### Judging flow

1. User types a response
2. The app sends the participant packet plus the user response to `app/api/judge-roleplay/route.ts`
3. The local judge engine scores PI coverage, structure, and response quality
4. The app reveals the judge-side results

## 9. Important implementation notes

- No API key is required
- No database is required for this MVP
- Data is stored locally in JSON files for simplicity
- The app is structured so AI or a database can be added later
- Judge results stay hidden until the user submits a response

## 10. Suggested next upgrades

If you want to grow this after the MVP, good next steps are:

- save past attempts in a database
- add voice recording or speech-to-text
- let users upload official DECA PI packets
- support timed practice rounds
- add optional AI generation and judging later
- add side-by-side comparison of multiple attempts
