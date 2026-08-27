# MediSync Frontend

This is the frontend for **MediSync**, an AI Shift-Handoff & Discharge Copilot. It provides the upload UI and review dashboard for generating Discharge Summaries and Shift-Handoff Notes with source-attributed citations.

## Tech Stack

- Vite
- TypeScript
- React
- shadcn/ui (Radix UI + Tailwind CSS)
- TanStack Query
- Zustand
- Recharts

## Getting Started

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app runs on http://localhost:8080 and proxies API requests to the FastAPI backend at http://localhost:8000/api/v1.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run build:dev` — development build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint
- `npm run test` — run tests with Vitest
