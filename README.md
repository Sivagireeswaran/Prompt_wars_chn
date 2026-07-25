# RecovrAI 💚

A compassionate, voice-first AI recovery companion for people navigating substance use disorders. Built with Next.js 16 and Gemini AI.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Demo login (pre-filled on the login page):**
- Email: `sivacodesss@gmail.com`
- Password: `123456`

Just click **Sign In** — no typing needed.

---

## ⚙️ Environment Setup

Create a `.env` file in the project root:

```env
# Gemini AI (get from https://aistudio.google.com/apikey — key starts with AIza...)
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy_YOUR_KEY_HERE

# Firebase (from Firebase Console → Project Settings → Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> ⚠️ After editing `.env`, **restart** `npm run dev` — Next.js only reads env vars at startup.

---

## 🗂️ Features

### 💬 AI Recovery Companion (`/companion`)
- Chat with an empathetic AI trained to support substance use recovery
- **Voice input** — click the 🎤 mic button and speak naturally
- **Text-to-speech** — the AI reads responses aloud (consistent voice, locked at startup)
- **Deaf Mode** (🧏 toggle) — disables audio, enables:
  - **Gesture Quick-Tap grid** — tap Anxious / Craving / Need Help / Lonely for zero-typing input
  - **Visual Breathing Pacer** — animated circle to guide breathing
  - **ASL Sign Guide** — visual sign demonstrations
- Auto-submit countdown after voice input (3 seconds, cancellable)

**What you can say:**
| Input | Response |
|---|---|
| "I am feeling panic" | 5-4-3-2-1 grounding technique |
| "I'm having a craving" | 4 D's coping strategy |
| "I had a relapse" | Non-judgmental support |
| "What is drug recovery?" | Educational explanation |
| "I need help" | Crisis resources + 988 |
| "I feel lonely / sad" | Validation + grounding |
| "I'm in withdrawal" | Medical guidance + emergency prompt |

> If the Gemini API key is invalid or quota is exceeded, the companion uses a smart **offline fallback** that covers the most common recovery scenarios.

---

### 📚 Learn & Grow (`/education`)
- Select a topic from the sidebar or search any recovery question
- AI generates a personalized educational article in real-time
- Categories: Understanding Recovery, Coping Strategies, Prevention & Wellness

---

### 📍 Find Clinics (`/therapy-match`)
- Search verified de-addiction centers by city (India)
- GPS button reverse-geocodes your location for automatic city detection
- If no listed centers exist for a city, shows a live **Google Maps search** fallback link

---

### 👥 Emergency Supporters (`/dashboard`)
- Add family members, caregivers, or friends with their phone number
- On mobile: **Send SMS** opens a pre-filled text with your GPS coordinates
- On desktop: copies the emergency message to clipboard
- Contacts are stored in Firebase and persist across sessions

---

### 📍 Emergency Location Share (`/dashboard`)
- Get your GPS coordinates on demand
- Copy a Google Maps link to share with anyone instantly

---

### 🚨 Crisis Resources (`/dashboard`)
- **988** Suicide & Crisis Lifeline (US) — call or text
- **Tele MANAS 14416** (India) — 24/7 toll-free, 22+ languages
- Deaf / Hard of Hearing relay: TTY via 711 then 988
- Veterans Crisis Line: 988 then Press 1

---

## 🔐 Firebase Security Rules

Set these in **Firebase Console → Firestore → Rules** to allow authenticated users to read/write their own data:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /conversations/{doc} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /safetyPlans/{doc} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI | Google Gemini 2.0 Flash |
| Auth & DB | Firebase Auth + Firestore |
| Voice Input | Web Speech API (Chrome/Edge) |
| TTS | Web Speech Synthesis API |
| Styling | Vanilla CSS (HSL design tokens, glassmorphism) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/           # Login / Sign Up page
│   ├── companion/      # AI chat companion
│   ├── dashboard/      # User home + emergency contacts
│   ├── education/      # Learn & Grow
│   ├── therapy-match/  # Clinic finder
│   └── api/ai/         # Server-side Gemini API routes
├── components/         # Navbar, shared components
├── context/            # AuthContext (Firebase user state)
└── lib/
    ├── firebase.js     # Firebase helpers
    └── gemini.js       # Gemini AI service + offline fallback
```
