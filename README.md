# MEV AI — Intelligence Without Limits

Phase 1–3: landing page, full Firebase authentication, dashboard shell, and all six AI
modules — Chat, Image Generator, Voice Chat, PDF Chat, Code Assistant, Web Search.

## Stack
React 18 + TypeScript + Vite · Tailwind CSS · Firebase (Auth, Firestore, Storage, Hosting) ·
OpenRouter (chat + web search) · Pollinations.ai (images, free/keyless) · Web Speech API (voice) ·
pdfjs-dist (PDF parsing) · Framer Motion · Lucide React · React Router · react-markdown + highlight.js

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com) → Create project.
   - Add a Web App, copy the config values.
   - Enable **Authentication** → Sign-in method → turn on **Email/Password** and **Google**.
   - Enable **Firestore Database** (start in production mode — rules are already provided).
   - Enable **Storage**.

3. **Get a free OpenRouter key** (powers AI Chat, Code Assistant, PDF Chat, Voice Chat, and Web Search)
   - Sign up at [openrouter.ai](https://openrouter.ai/keys), create a key — no card required for free-tier models.

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in the six `VITE_FIREBASE_*` values, plus `VITE_OPENROUTER_API_KEY`.

5. **Run locally**
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173`.

6. **Deploy security rules** (recommended before going live)
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init   # select your project, keep existing firestore.rules / storage.rules
   firebase deploy --only firestore:rules,storage:rules
   ```

7. **Build & deploy hosting**
   ```bash
   npm run deploy
   ```

## What's included so far
- Landing page: Hero, Features, Pricing (Free/Pro/Premium/Business), Testimonials, FAQ, Footer
- Auth: Register, Login, Forgot Password, Google Sign-In — wired to real Firebase Auth
- Firestore user profile auto-created on signup (`plan: free`, `role: user`, usage counters, preferences)
- **Dashboard shell**: sidebar with all modules active
- **AI Chat**: streaming via OpenRouter, markdown + syntax-highlighted code, copy/stop/regenerate/edit, auto-scroll, saved to Firestore
- **Image Generator**: free text-to-image via Pollinations.ai, prompt box, history, download, delete
- **Voice Chat**: browser-native speech-to-text input and text-to-speech output, 7 languages, no API cost
- **PDF Chat**: client-side PDF text extraction (pdfjs-dist), ask questions, summarize, extract key facts — nothing uploaded to a server
- **Code Assistant**: chat tuned with a code-focused system prompt for debugging and snippets
- **Web Search**: live, cited web results via OpenRouter's online-grounded models — same key as AI Chat, no separate search API needed
- **Chat History & Saved Chats**: every AI Chat conversation is saved, listed, resumable, starrable, deletable
- **Profile**: live account summary, password-protected account deletion
- **Settings**: AMOLED dark mode (app-wide), AI response language (used across all chat modules), push notifications, data export, password change
- Firestore & Storage security rules (role/plan/ban fields are server/admin-only, never client-writable)
- PWA manifest + service worker (installable, offline app shell)
- SEO meta tags, responsive down to mobile, reduced-motion support, focus-visible states

## A security note on API keys
The OpenRouter key is currently used directly from the browser for simplicity. This is fine
for personal use or a demo, but before charging real users, proxy the calls in
`src/lib/aiClient.ts` and `src/lib/webSearch.ts` through a Firebase Cloud Function so the key
never reaches the client and you can enforce per-plan rate limits (Free = 20 chats/day, etc.)
server-side, where they can't be bypassed. Pollinations.ai and the Web Speech API need no key
at all, so there's nothing to protect there.

## Next build phases (not yet built)
- Admin panel (user management, subscriptions, coupons, analytics, support tickets)
- Razorpay payment integration and subscription activation
- Server-side rate limiting (Cloud Functions) enforcing the Free plan's 20 chats/day
- Maintenance mode, feature toggles

We're building this in stages so each phase ships as real, working code rather than
stubbed-out screens — ask for the next phase whenever you're ready.


