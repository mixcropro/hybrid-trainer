# HYBRID AI TRAINER - PROJECT ARCHITECTURE & CONTEXT

## 1. Project Overview & Tech Stack
- **Framework:** Next.js (App Router, TypeScript) hosted on Vercel.
- **Database & Source of Truth:** Supabase (PostgreSQL) storing `user_profile`, `garmin_daily`, `activities`, `scheduled_workouts`, `chat_messages`, and `user_memory`.
- **Reasoning Engine:** Direct REST API calls to Google Gemini API (`gemini-3.8-flash` / `gemini-3.6-flash` / `gemini-3.5-flash-lite` fallback chain).
- **Integrations:** Garmin Personal API Key for real-time biometrics and activity sync.
- **Network Rule:** Must use IPv4 resolution (`dns.setDefaultResultOrder('ipv4first')`) in API routes to prevent Windows Node.js fetch sockets from hanging.

## 2. Domain & Athletic Logic
- **Athlete Focus:** Triathlon (Swim, Road/TT Bike with power meter, Run/Trail) + 3-day Full-Body Strength Split (Squats, Bench, RDLs, Core).
- **Physiological Metrics:**
  - TSS (Training Stress Score) per activity.
  - Banister Impulse Model: ATL (Acute Workload / Fatigue - 7d avg), CTL (Chronic Fitness - 14d+ avg), TSB (Training Stress Balance / Form = CTL - ATL).
  - Recovery metrics: HRV status (ms), Sleep Score (0-100), Resting HR.
- **Core Principle ("User Overrule"):** The athlete ALWAYS has the final word. If the user disagrees with AI recommendations, the AI must yield, respect the user's choice, and recalculate fatigue/volume compensation for the subsequent 2 days.

## 3. Database Schema Reference
- `user_profile`: Biometrics (age, weight, height), physiological thresholds (FTP, LTHR, Max HR), 1RM gym strength benchmarks, active injuries, target events.
- `activities`: Historical completed sessions (Garmin auto-synced + manual) across all sports (running, treadmill, outdoor/indoor cycling, swimming, strength, walking, hiking).
- `scheduled_workouts`: Calendar of planned future workouts with target TSS and structure.
- `chat_messages`: Short-term chat history (preserves full conversation context across tab switches in UI using hidden state).
- `user_memory`: Long-term factual memory extracted from conversation logs.

## 4. Coding & Tone Guidelines
- Respond pragmatic, direct, and empirically accurate.
- Always implement explicit UI states, error handling, and robust typing.
- Language for user interactions: Croatian (official orthography: "sinkronizacija").