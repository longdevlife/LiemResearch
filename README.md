# Publication Trend System

> **AI-assisted Scientific Publication Trend Analysis** — multi-source academic metadata aggregation + vector semantic search + LLM-grounded analytical reports + MCP tool calling, to help researchers discover trends, evaluate papers, and identify research gaps.

This repository is a **pnpm + Turborepo mono-repo** containing three runnable apps and one shared package.

---

## Repo layout

```
.
├── apps/
│   ├── backend/              Node.js 20+ · Express 5 · TypeScript · Mongoose · BullMQ · Gemini
│   ├── web/                  React 18 · Vite · Tailwind · shadcn/ui · TanStack Query · React Router
│   └── mobile/               Expo SDK 52 · React Native · Expo Router · NativeWind · TanStack Query
├── packages/
│   └── shared-types/         framework-agnostic TypeScript types shared by all three apps
├── docker-compose.yml        local MongoDB + Redis (+ optional mongo-express UI)
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## Prerequisites

| Tool | Version | How to get it |
|---|---|---|
| Node.js | **>= 20** (22 recommended) | https://nodejs.org |
| pnpm | **>= 11** | `npm install -g pnpm` |
| Docker Desktop | latest | https://docker.com/products/docker-desktop |
| Git | any | https://git-scm.com |
| **Gemini API key** | free tier OK | https://aistudio.google.com/apikey |
| Android Studio | only for mobile Android emulator | https://developer.android.com/studio |
| Xcode | only for mobile iOS simulator (Mac only) | App Store |

> You do not need MongoDB Atlas during local development — `docker compose` spins up a local Mongo. Atlas (with Vector Search enabled) is for deployment.

---

## First-time setup

```bash
# 1. install all workspace deps (one command for backend + web + mobile + shared-types)
pnpm install

# 2. copy env templates and fill them in
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example     apps/web/.env
cp apps/mobile/.env.example  apps/mobile/.env

# In apps/backend/.env, set at minimum:
#   GEMINI_API_KEY=...        (from Google AI Studio)
#   JWT_ACCESS_SECRET=...     (run the one-liner the .env.example shows)
#   JWT_REFRESH_SECRET=...    (different value from the access secret)

# 3. start MongoDB + Redis
pnpm docker:up                # mongo:27017, redis:6379, mongo-express:8081

# 4. start everything (backend + web; mobile starts separately because it opens a UI)
pnpm dev:backend              # http://localhost:4000  → GET /health
pnpm dev:web                  # http://localhost:5173
pnpm dev:mobile               # opens Expo dev tools, scan QR with Expo Go
```

To stop the databases when you're done: `pnpm docker:down`.

---

## Common commands

```bash
pnpm dev                      # turbo: run all apps' dev scripts in parallel
pnpm dev:backend              # backend only
pnpm dev:web                  # web only
pnpm dev:mobile               # mobile only (Expo)

pnpm build                    # build all
pnpm typecheck                # tsc --noEmit across the whole repo
pnpm lint                     # lint everything

pnpm docker:up                # start mongo + redis (detached)
pnpm docker:down              # stop them
pnpm docker:logs              # tail their logs
```

---

## What goes where (rules to keep the repo sane)

- **Shared TypeScript types live in `packages/shared-types`.** If both web and backend need an interface (e.g. `Paper`, `Report`, `AuthTokens`), put it there. No framework imports allowed inside that package.
- **Backend modules are self-contained.** A module under `apps/backend/src/modules/<name>/` owns its own routes, controller, service, schema, and Mongoose model. Cross-module calls go through the service layer, never directly into another module's model.
- **Long-running work goes through BullMQ.** API sync, embedding generation, and report generation MUST be enqueued — never run inside an HTTP handler. See `apps/backend/src/queue/queue.ts`.
- **LLM calls are cached.** Every LLM response is keyed by `hash(query + filters + model + prompt_version + retrieved_paper_ids)` and stored in Redis. We never call the LLM during normal search — only when the user explicitly requests AI analysis.
- **Embeddings go through `getEmbeddingProvider()`.** Don't import `GeminiEmbeddingProvider` directly outside the factory — that's how we swap to self-hosted `@xenova/transformers` later.
- **Auth is JWT with rotated refresh tokens.** Refresh tokens are stored hashed in Mongo with a TTL index. Web persists tokens to localStorage; mobile persists to expo-secure-store (keychain/keystore).

---

## Tech decisions (and why)

| Decision | Why |
|---|---|
| Mono-repo with pnpm + Turborepo | Share `@trend/shared-types` between 3 apps without copy-paste. Vercel-friendly. |
| Express 5 over Fastify | Team familiarity; Express 5 has built-in async error handling. |
| MongoDB + Atlas Vector Search | Single store for metadata + embeddings; no separate vector DB needed. Local dev uses plain Mongo (no vector index); Atlas M0+ for prod. |
| Gemini (LLM + embeddings) | One SDK, one API key, generous free tier, cheap production tier. |
| BullMQ + Redis | Industry standard for Node job queues; survives restarts. |
| Expo over bare React Native | OTA updates, EAS Build, no native toolchain pain for the common case. |
| NativeWind | Reuse Tailwind muscle memory across web + mobile. |

---

## Phase roadmap (high level)

1. **Phase 1 — Core** · auth · paper CRUD · OpenAlex sync · keyword search · trend dashboard
2. **Phase 2 — AI basics** · embeddings (Gemini) · semantic search · LLM summary · relevance scoring
3. **Phase 3 — RAG + Reports** · retrieve-augment-generate pipeline · markdown analytical reports
4. **Phase 4 — MCP + Gaps** · define MCP tools · LLM calls tools · research gap analysis
5. **Phase 5 — Polish** · mobile push notifications · DOI scanner · admin dashboard

See individual app READMEs for module-level layout.

---

## License

UNLICENSED — academic project (FPT University WDP301).
