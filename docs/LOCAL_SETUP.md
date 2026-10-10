# Local setup — ChargeSathi chatbot

`check_env` does not exist in this repository. Use this file and `backend/.env.example`.

## Backend

1. Copy `backend/.env.example` to `backend/.env` (that file is gitignored).
2. Set `GEMINI_API_KEY` to your Gemini key. This key is also used by Photo Check AI. **Do not put it in frontend env files.**
3. Set `CHATBOT_MODEL` to the Gemini model for the chatbot (default `gemini-3.8-flash`). Do **not** reuse Photo Check’s `GEMINI_MODEL` for this setting.
4. Optional caps: `CHATBOT_TIMEOUT_SECONDS`, `CHATBOT_RATE_LIMIT_PER_MINUTE`, `CHATBOT_MAX_OUTPUT_TOKENS`, `CHATBOT_MAX_MESSAGE_CHARS`, `CHATBOT_MAX_HISTORY_TURNS`, `CHATBOT_THINKING_BUDGET`.
5. From `backend/`, with the virtualenv active:

```text
python manage.py migrate
python manage.py runserver
```

6. Chat endpoint: `POST http://localhost:8000/api/v1/chat/` with header `Authorization: Bearer <supabase-access-token>` and JSON `{"message":"...","history":[]}`. Only `ev_owner` profiles are allowed. Conversations are not stored.

## Frontend

`NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` must point at the Django origin (default `http://localhost:8000`). There is no chatbot API key on the frontend.

```text
cd frontend
npm run dev
```

Open `/dashboard/owner` as an EV owner. The ChargeSathi launcher is bottom-right.

## Do not run

Do not start `chargesathi/server.js` or `chargesathi/run.bat`. That Node server is not part of ChargeNOC and would collide with the Next.js port (3000).
