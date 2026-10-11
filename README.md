# ⚡ ChargeNOC & ChargeSathi AI Suite

> **Unified EV Charging Infrastructure, AI Safety Screening & Multilingual Driver Support**  
> Compliant with **IS 732**, **IS 17017**, and **CEA Regulations 2023**

---

## 🌟 Executive Overview

**ChargeNOC & ChargeSathi** is an end-to-end intelligent platform engineered for residential housing societies (RWAs), commercial parking spaces, and EV drivers across India. It solves the critical safety, administrative, and technical bottlenecks in EV charging adoption through two perfectly merged AI engines:

1. **ChargeNOC AI (Site Safety & Vision Screener)**:
   - Multimodal computer vision (Google Gemini 1.5/2.5 Flash + local Edge Neural classifier) inspecting physical installation bays.
   - Enforces deterministic, rule-based verdicts (`CONTINUE_TO_ELECTRICIAN`, `CORRECTION_REQUIRED`, `RETAKE_PHOTO`, `MANUAL_REVIEW`).
   - Detects 8 authoritative hazard categories: moisture seepage streaks, exposed/damaged wiring, combustibles, walkway obstructions, cramped spaces, and electrical flaws.
   - Generates automated preliminary hardware checklists (cables, conduit, breakers, RCDs, weather enclosures, earthing test requirements).
   - Directly compiles into a tamper-proof **Haan Packet** (Digital Society NOC with QR verification).

2. **ChargeSathi AI (Multilingual EV Driver Chatbot)**:
   - Expert AI charging helper for 2-wheelers, 3-wheelers, 4-wheelers, and commercial fleets across India.
   - Multi-dialect support across **11 Indian languages**: English, हिन्दी (Hindi), Hinglish, বাংলা (Bengali), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ಕನ್ನಡ (Kannada), മലയാളം (Malayalam), and ਪੰਜਾਬੀ (Punjabi).
   - **Automated Severity Classification**: Prefixes all diagnostic responses with `[[SEV:low]]`, `[[SEV:medium]]`, or `[[SEV:high]]`.
   - **Emergency SOS Protocol**: High-severity events (smoke, sparks, tingling shock, burning smell) trigger an immediate warning banner with one-tap 112 / Fire 101 emergency hotline dialing.
   - **Built-in Offline Knowledge Base**: Instant fallback diagnostic resolution for stuck connectors, tripping MCBs, slow charging, rain/water contact, and app authorization timeouts.

---

## 📂 Repository Structure

```tree
ArcReactor/SHIFT-2026-W7DS87/
├── .gitignore                      # Complete repository ignore definitions
├── README.md                       # Comprehensive platform documentation
├── SHIFT-2026-W7DS87-AI/            # Authoritative AI Specifications & Reference Models
│   ├── AI WORKING DOC.pdf          # Core specification doc for Vision & Chatbot
│   ├── CHATBOT/                    # Standalone ChargeSathi Node/HTML service
│   │   ├── chargesathi.html        # Interactive web UI with offline fallbacks
│   │   ├── server.js               # Node.js backend streaming Gemini proxy
│   │   └── README.md               # Chatbot guide & quick start
│   └── IMAGE-BASED DECISION/       # Python reference implementation (chargenoc_ai)
│       ├── app.py                  # Flask web demonstration server
│       ├── chargenoc_ai/           # schemas.py, hardware_rules.py, vision_screening.py
│       ├── data/                   # 15 evaluation sets & testing shotlists
│       └── requirements.txt        # Python dependencies
└── app/                            # Universal Mobile & Web Client (Expo React Native)
    ├── package.json                # Dependencies (@google/genai, expo, nativewind)
    ├── src/
    │   ├── app/
    │   │   └── dashboard/
    │   │       ├── ai-check.tsx    # Unified AI Suite Screen (Vision Screener + ChargeSathi)
    │   │       ├── index.tsx       # Live Telemetry & Charging Plan Dashboard
    │   │       ├── new-request.tsx # NOC Application Form & Checklist
    │   │       ├── packet.tsx      # Haan Packet (Society NOC Dossier with QR)
    │   │       ├── billing.tsx     # Virtual Meter & Tariff Reconciliation
    │   │       └── profile.tsx     # EV & Resident Profile Management
    │   ├── lib/
    │   │   ├── ai-vision-service.ts    # Fully merged ChargeNOC AI & Edge Vision Engine
    │   │   ├── chargesathi-service.ts  # ChargeSathi AI Chatbot service & offline rules
    │   │   ├── noc-packet-service.ts   # Digital NOC dossier generation
    │   │   └── load-planner-service.ts # EV database & charging curve algorithms
    │   └── components/             # Reusable UI tokens, animated icons & glass cards
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0 or newer)
- **npm** or **bun**
- (Optional for Python reference tools): Python 3.10+

### 2. Quick Setup & Run (Universal App)

```bash
# Navigate to the app directory
cd app

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

Press:
- `w` to open in your web browser (`http://localhost:8081`)
- `a` to run on Android Emulator / connected device
- `i` to run on iOS Simulator
- Scan the terminal QR code in **Expo Go** on your physical phone

### 3. Configuring Gemini AI Key

You can configure your key in two ways:
1. **In-App Modal**: Tap the **Gemini AI Config** badge at the top of the **AI Check** screen, paste your key starting with `AIzaSy...`, and tap **Test & Save**.
2. **Environment Variable**: Set `EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...` in `app/.env`.

> *Note*: If no external key is entered, the platform automatically engages the built-in **Edge Neural Signal Engine** and the **ChargeSathi Offline Knowledge Base**, guaranteeing 100% uninterrupted operation without crashes.

---

## 🛡️ Safety & Regulatory Standards

The AI engines strictly follow Indian national electrical safety codes:
- **IS 17017 (Part 1 & 2)**: Electric Vehicle Conductive Charging System standards.
- **IS 732**: Code of practice for electrical wiring installations.
- **CEA (Measures relating to Safety and Electric Supply) Regulations 2023**: Mandatory dedicated breaker isolation, protective earthing (<5 Ohms), and RCD 30mA requirements.
- **IS 1293**: Standard plugs and socket-outlets for residential installations.

---

## 🤝 Branch Management & Git Hygiene

- Active Development Branch: `app`
- Production Secrets & API keys are strictly excluded via `.gitignore`.