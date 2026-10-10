# ChargeSathi

EV charging help chatbot. Files: `chargesathi.html` (page), `server.js` (Gemini backend), `.env` (API key aur model).

## Chalane ka tarika (Gemini)

1. `.env` kholkar `GEMINI_API_KEY=` ke aage apni key check/enter karein.
2. Seedha **`run.bat`** par double click karein (yeh browser bhi auto-open kar dega).
   *Ya terminal mein:* `node server.js`
3. Browser mein `http://localhost:3000` chalega.

Key sirf server par rehti hai, browser ko nahi milti. `.env` kisi ko share ya upload na karein.
HTML ko seedha double-click karne par chatbot offline mode mein chalta hai.

## Important

- Multilingual AI replies (Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, English) sirf Claude ke artifact page par chalte hain, kyunki wahi model access deta hai.
- Is file ko apne computer par seedha kholne par chatbot "offline mode" mein chalta hai: 6 common problems ka built-in English guide milta hai, aur emergency warning (112 / 101) kaam karti hai.
- Apni website par AI replies chalane ke liye `INSTRUCTIONS` text (script ke andar) ko apne server-side model API call mein system prompt ki tarah use karein, aur `sample(...)` call ko apni API call se badlein.

## Safety

Yeh general guidance hai. Wiring, earthing ya electrical fault ke liye licensed electrician se milein. Live use se pehle EV technician se safety steps review karwa lein.
