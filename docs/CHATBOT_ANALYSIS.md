# ChargeSathi analysis (Step 1)

Inspected on 11 Oct 2026. Source folder: `d:\IIT BHU\website\chargesathi`. Display name: **ChargeSathi**.

Confirmed with the product owner before this document:

- Provider: Google Gemini (as in the folder).
- Model setting for ChargeNOC: a **separate** `CHATBOT_MODEL` (must not reuse Photo Check’s `GEMINI_MODEL`).
- Chat history: **session only**, nothing stored. Clear chat wipes it.
- Owner request data: **not** in scope. General EV charging and ChargeNOC process questions only.
- Do **not** run `server.js` beside Django. Port the logic into a Django endpoint.

No blocker found for that plan. Gemini is a billed Google API; the owner stated a key is ready locally (not in git). Source files contain no hardcoded API keys.

---

## What it is

A **standalone web app**, not a React component and not a Python/Django service.

| File | Role |
|------|------|
| `chargesathi.html` | Single-page chat UI (vanilla HTML/CSS/JS). No bundler, no React. |
| `server.js` | Node 18+ **stdlib-only** HTTP server: serves the HTML, proxies Gemini (`generativelanguage.googleapis.com`) with SSE streaming. |
| `package.json` | `{ "name": "chargesathi", "version": "1.0.0" }`, script `start`: `node server.js`, `engines.node: >=18`. **No npm dependencies.** |
| `run.bat` | Windows launcher: checks Node, copies `.env.example` → `.env` if missing, opens `http://localhost:3000`, runs `node server.js`. |
| `.env.example` | `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.8-flash`, `PORT=3000`. |
| `.gitignore` | `.env`, `node_modules`. |
| `README.md` | Run instructions (Hindi/English mix), offline-mode notes, safety disclaimer. |

**Entry points**

- With Gemini: `node server.js` or `run.bat` → `http://localhost:3000`.
- Without the server (file:// or HTML without `/api/status` ready): **offline mode** — six regex-matched English guides plus an emergency banner.

**Not present:** Python service, React package, knowledge-base documents on disk (only an in-HTML `KB` array), licence file.

---

## How to run (standalone, not used in ChargeNOC)

```text
cd chargesathi
# copy .env.example to .env and set GEMINI_API_KEY
node server.js
```

Observed from `package.json` / `server.js`: listen port default `3000`; model default `gemini-3.8-flash`; key read only on the server.

---

## Dependencies and conflicts

| Piece | ChargeSathi | ChargeNOC | Conflict |
|-------|-------------|-----------|----------|
| UI | Vanilla HTML + inline CSS (teal/mint, Google Fonts CDN) | Next.js 16.4.0, React 19.3.0, Tailwind v4, tokens black/orange/gold | **Cannot drop the HTML into the dashboard.** Rebuild as a React widget using existing tokens. |
| Server | Node `http`/`https` on port **3000** | Frontend `next dev` is also port 3000; API is Django on 8000 | **Must not run `server.js` next to Django.** Port Gemini call into Django. |
| npm | none | Many frontend packages | No package-version clash. |
| Python | none | Django 5.1, DRF, django-environ, PyJWT | No Python dep clash. `google-genai` is imported by Photo Check (`assessments/services/chargenoc_ai/vision_screening.py`) but is **not** in `backend/requirements.txt`. Chatbot will use the **REST** API via the stdlib (same as `server.js`), not that SDK, and will not edit Photo Check files. |
| Gemini env | `GEMINI_API_KEY`, `GEMINI_MODEL` | Photo Check already uses `GEMINI_API_KEY` and `GEMINI_MODEL` | **Share the API key.** Use **`CHATBOT_MODEL`** for this bot so vision model choice is untouched. |

---

## Model, data sent, system prompt, knowledge

**Provider:** Google Gemini, `POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:streamGenerateContent?alt=sse`

**Auth to Google:** header `x-goog-api-key` (server only). Browser never receives the key.

**Body sent to Google:**

- `systemInstruction.parts[0].text` = `INSTRUCTIONS` from `server.js` (duplicated in `chargesathi.html` for the Claude-artifact path only).
- `contents`: up to 12 turns, roles `user` | `model`, each `parts[0].text` ≤ 4000 chars; last role must be `user`.
- `generationConfig`: `temperature: 0.3`, `maxOutputTokens: 1024`, `thinkingConfig.thinkingBudget: 0`.

**Not sent:** ChargeNOC request IDs, bills, conditions, profile, cookies. Conversation text **is** sent to Google.

**System prompt (summary of `INSTRUCTIONS` in `server.js`):** ChargeSathi is an EV charging helper for drivers/owners in India. Reply in the user’s language. First line must be `[[SEV:low|medium|high]]`. High severity → 112 / fire 101 steps. Otherwise likely cause + 3–6 steps + “Next safe step”. Do not advise bypassing protection, extension cords, etc. Do not invent error-code meanings. ~150 words. **Scope: EV charging only**; refuse other topics and instruction-override attempts.

**Knowledge base:** in-HTML `KB` (six English troubleshooting scripts) used **only when Gemini is unavailable**. Not a document store.

**ChargeNOC process:** **not** in the original prompt. That knowledge must be added from **this repo’s documented behaviour only** (request/evidence/photo-check/RWA decision/Haan Packet disclaimer). No owner-specific records.

---

## Input / output, streaming, errors

**Browser → `server.js`**

- `GET /` or `/index.html` → HTML.
- `GET /api/status` → `{ ready: boolean }` (key present and not a placeholder).
- `POST /api/chat` body `{ contents: [...] }`.

**`server.js` → browser**

- Success: `text/event-stream`; Gemini SSE piped through. Client concatenates `candidates[0].content.parts[].text`.
- Missing key: `401` `{"error":"GEMINI_API_KEY missing in .env"}`.
- Bad body: `400` `{"error":"bad request"}`.
- Upstream 429 → 429; 400/403 → 401; other → 502 `{"error":"upstream"}`.
- Network: `502` `{"error":"network"}`.
- Raw body cap ~60 000 bytes; destroy request if exceeded.

**UI:** Enter sends, Shift+Enter is not special-cased in the textarea (Enter without Shift submits). Streaming “cells” indicator. Retry button. No “clear conversation” control. Offline fallback if `/api/status` is not ready. Language `<select>` stored in `localStorage` key `chargesathi-lang`.

**HTML rendering:** model output is parsed into DOM with `createTextNode` / `<strong>` for `**bold**` and list nodes. **No `innerHTML` of model text.**

---

## Security review

| Issue | Finding |
|-------|---------|
| Hardcoded keys | **None** in the seven source files. Key from env. |
| Key in the browser | **No**, when using `server.js`. HTML file:// never sees a key (offline). |
| Unsafe HTML of model output | **Mitigated** in original (text nodes only). Dashboard must keep that. |
| Prompt injection | System prompt is server-side, which is good. User text is still forwarded to Gemini. Rule 9 asks the model to ignore override attempts; this is **not** a hard guarantee. Treat user text as untrusted in Django (delimit messages; never let the client set `systemInstruction`). |
| Unvalidated input | Length and role checks exist (12 turns, 4000 chars). No auth on `server.js`. |
| Logging of personal data | `console.error("Gemini error", status, errBody.slice(0, 300))` can log upstream bodies. Dashboard must **not** log message content. |
| Unbounded cost | Partial caps (tokens, turns, chars). **No per-user rate limit**, no request timeout in `server.js`. Django must add both. |
| Auth | `server.js` is open on localhost. Dashboard endpoint must require a logged-in **ev_owner** (Supabase token, same as other APIs). |
| Emergency regex | Client-side `EMERG` patterns show a banner before the model returns. Advisory only. |

`chargesathi/.env` exists on this machine (gitignored). It was **not** opened for this write-up. `backend/.env` was **not** present at inspection time; ChargeNOC chatbot config must live in `backend/.env` (gitignored).

---

## Licence

No `LICENSE` file, copyright header, or third-party data dump in `chargesathi/`. Treat as **unpublished project-local code**. Google Fonts in the HTML are loaded from Google’s CDN (not bundled). Emergency numbers 112 / 101 are public India numbers, not a licensed dataset.

---

## Gap list vs EV Owner dashboard

1. **Process:** original bot does not explain ChargeNOC (submit request, photo slots, Photo Check is not certification, RWA decision, Haan Packet is not a legal NOC). Must add **factual** process text from this repo only.
2. **No owner records** (confirmed): do not load request status, conditions, or bills into the prompt.
3. **Auth and roles:** none in ChargeSathi; need `IsEVOwner` + existing `SupabaseAuthentication`.
4. **UI chrome:** teal standalone page vs floating launcher + desktop side panel / mobile sheet on `/dashboard/owner/*` only, using ChargeNOC tokens and `lucide-react`.
5. **Logo:** HTML mark is a generic bolt in a rounded square. Need an original ChargeSathi mark (bubble + plug/bolt), not a robot head.
6. **Transport:** SSE proxy vs existing JSON `api` client. Django will return JSON (typing indicator in the UI) so we do not run a second stream server. **Documented change from `server.js`.**
7. **Session:** original keeps `history` in a JS array (lost on reload) but has no Clear control. Need Clear chat; still no DB.
8. **Language picker / offline KB / Claude `window.claude.use`:** not required for the dashboard. Language: follow the user’s message language in the system prompt. Offline KB: **not** ported (errors must be visible, nothing fabricated).
9. **Safety copy:** keep “AI can be wrong / not electrical certification / licensed electrician or RWA” in the prompt **and** always visible in the UI.
10. **Env:** Photo Check uses `GEMINI_MODEL`; chatbot uses `CHATBOT_MODEL`. `check_env` **does not exist** in this repo (searched). `.env.example` for Django was missing; must be added.
11. **Port 3000** clash if anyone runs `run.bat` during frontend dev.

---

## Integration decision

Port `server.js` Gemini logic into `POST /api/v1/chat/` on Django. Do not start Node. Do not call Gemini from the browser. Do not edit Photo Check / `vision_screening.py`.

---

## Evidence for this step

Commands run (PowerShell; `&&` is invalid in this shell):

```text
git status -sb; git branch --show-current
```

Output:

```text
## WEBSITE...origin/WEBSITE
 M .gitignore
 M frontend/src/app/page.tsx
?? chargesathi/
WEBSITE
```

Then:

```text
git checkout -b chatbot-integration
```

Output:

```text
Switched to a new branch 'chatbot-integration'
```

Files read (no execution of `node server.js` in this step): `chargesathi/server.js`, `chargesathi/chargesathi.html`, `chargesathi/package.json`, `chargesathi/README.md`, `chargesathi/.env.example`, `chargesathi/run.bat`, `chargesathi/.gitignore`, plus ChargeNOC `backend/chargenoc/settings.py`, `urls.py`, `core/authentication.py`, `core/permissions.py`, `frontend/package.json`, `frontend/src/lib/api-client.ts`, `frontend/src/app/dashboard/owner/layout.tsx`, Photo Check `vision_screening.py` **read-only**.
