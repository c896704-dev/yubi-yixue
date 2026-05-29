# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start both Express backend (port 3002) + Vite frontend (port 5173) via concurrently |
| `npm run build` | Production build (Vite) |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) — no emit, strict mode |
| `npm start` | Express backend only |
| `npm run db:migrate` | Run database migration (`server/db-migrate.js`) |

There are no test or lint scripts. The sole test file is `src/utils/__tests__/tenGod.test.ts`; run it ad-hoc with a test runner. The `.claude/launch.json` config `yubi-yixue` starts the full dev server on port 5173.

## Architecture

**Stack:** React 18 + TypeScript + Vite 6 (frontend) / Express 4 + better-sqlite3 (backend). ESM throughout (`"type": "module"`). Tailwind CSS 3 + custom CSS design system in `src/index.css`.

**Routing:** No React Router. `App.tsx` uses a `useState<Tab>` with four tabs: `bazi`, `compat`, `fengshui`, `divination`. Each tab conditionally renders its feature page. Login/register are modals overlaid on the current tab.

**Backend routes** are mounted in `server/index.js` under `/api/auth`, `/api/analyze`, `/api/records`, `/api/settings`, `/api/divination`, `/api/compat`, `/api/bazi`, `/api/ai`. Vite proxies `/api` to `localhost:3002`. Two middlewares apply globally: JWT auth (`server/middleware/auth.js`) is imported per-route; device ID tracking (`server/middleware/device.js`) is applied to all routes.

**Database:** SQLite via better-sqlite3, stored at `server/data/fengshui.db`. WAL mode + foreign keys enabled. Tables: `devices`, `analyses`, `suggestions`, `users`, `bazi_records`, `divination_records`, `compat_records`. Schema is defined in `server/db.js` with safe column migrations via `addColumnSafely`.

**AI integration:** Frontend calls `/api/ai/chat` → Express proxies to DeepSeek API (configured via `DEEPSEEK_BASE_URL` / `DEEPSEEK_API_KEY` in `.env`). DashScope (Qwen) is also configured as an alternative. AI prompt templates live in `src/utils/ai.ts`.

**Frontend data layer:**
- `src/services/api.ts` — Axios instance with interceptors that attach JWT token and `X-Device-Id` header
- `src/utils/db.ts` — IndexedDB wrapper for offline/persistent local record storage with cross-database migration for legacy records
- `src/context/AuthContext.tsx` — JWT stored in localStorage, provides user state app-wide

**Business logic core** (all in `src/utils/`):
- `bazi.ts` — Bazi (八字) chart calculation engine
- `shensha.ts`, `yongshen.ts`, `strength.ts`, `chonghe.ts`, `wangshuai.ts` — metaphysical analysis modules
- `compatibility.ts` — Pair compatibility analysis
- `features/divination/utils/` — `hexagrams.ts` (64 hexagrams), `trigrams.ts` (8 trigrams), `liuyao.ts` (纳甲排盘), `meihua.ts` (梅花易数 体用生克), `strokes.ts` (stroke counting), `liuyao-yongshen.ts` (用神取用)
- `solarTime.ts` — True solar time calculation for birth chart precision

**Visual design:** Traditional Chinese ink-wash aesthetic. Paper tones (`#F5F0E8` page, `#FAF9F4` cards), celadon green accents (`#7D957B`), cinnabar red (`#D67A2B`). Serif headings (Noto Serif SC), sans-serif body (Noto Sans SC). See `DESIGN_PLAN.md` for the full design system specification.

## Key conventions

- All new components go in `src/features/<domain>/` or `src/components/ui/` for shared UI
- API services follow the pattern in `src/services/`: one file per domain, all using the shared Axios instance from `api.ts`
- Server routes follow Express Router pattern; business logic lives in `server/services/`
- Backend files use `.js` extension (not `.mjs`), frontend uses `.tsx`/`.ts`
- Environment variables: copy `.env.example` to `.env` and fill in API keys

## Behavioral guidelines

**Think before coding.** State assumptions explicitly. If multiple interpretations exist, present them — don't pick silently. If something is unclear, ask.

**Simplicity first.** No features beyond what was asked. No abstractions for single-use code. No error handling for impossible scenarios. If 200 lines could be 50, rewrite it.

**Surgical changes.** Touch only what you must. Don't "improve" adjacent code or formatting. Match existing style. If you notice unrelated dead code, mention it — don't delete it. Remove only imports/variables that YOUR changes made unused.

**Goal-driven execution.** Transform tasks into verifiable goals with clear success criteria. For multi-step work, state a brief plan with verification steps.
