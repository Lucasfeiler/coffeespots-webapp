# CoffeeSpots

React + Vite frontend with an Express/Prisma/SQLite backend in [server/](server).

## Running locally

Two servers, two terminals:

```
cd server
npm install        # first time only
npx prisma migrate dev   # first time only — creates dev.db
npm run seed        # first time only — loads src/data/shops.js into the DB
npm run dev          # http://localhost:4000
```

```
npm install          # first time only, from the repo root
npm run dev          # http://localhost:5173
```

The frontend reads `VITE_API_URL` from `.env` (defaults to `http://localhost:4000`).

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
