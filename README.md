# Ultron

A **startup-focused personal AI assistant** built entirely on your stack — Next.js, TypeScript,
Tailwind CSS, Supabase — with **no cost anywhere in the chain**. The one
external cost that would normally show up (the LLM call) runs on Groq's
free tier, which needs only an email address to activate, no card.

## What's actually here

- Email magic-link auth (Supabase Auth) — no passwords to manage.
- A sidebar of conversations, each with its own persisted message history
  (Supabase Postgres, protected by Row Level Security so users only ever
  see their own data).
- A chat window that calls `/api/chat`, which asks Groq's free Llama model
  for a reply and saves both sides of the exchange.
- **Voice capabilities**: Text-to-speech with British male voice (Ultron/Jarvis-style) and speech-to-text for hands-free input
- **Startup-focused AI persona** specialized in:
  - Client outreach and cold email drafting
  - Email management and professional communication
  - Free marketing strategies and tactics
  - Competitive intelligence and analysis
  - Customer research and needs assessment

## 1. Create your free Supabase project

1. Go to https://supabase.com, sign up, and create a new project (free tier).
2. In the SQL Editor, paste the contents of `supabase/schema.sql` and run it.
   This creates the `conversations` and `messages` tables with RLS policies
   so each user only sees their own chats.
3. In your Supabase dashboard: **Authentication -> Providers -> Email** —
   make sure "Email" is enabled (it is by default). For local development
   you can also turn off "Confirm email" under **Authentication -> Settings**
   to skip the confirmation step while testing.
4. Copy your **Project URL** and **anon public key** from
   **Project Settings -> API**.

## 2. Get a free Groq API key

1. Go to https://console.groq.com/keys and sign up (email only, no card).
2. Create an API key.

## 3. Configure and run

```bash
cp .env.example .env.local
# then fill in the four values in .env.local with what you copied above

npm install
npm run dev
```

Open http://localhost:3000 — you'll be sent to `/login`. Enter your email,
click the link Supabase sends you, and you're in.

## 📚 Additional Guides

- **[STARTUP_GUIDE.md](./STARTUP_GUIDE.md)** — Comprehensive guide on using Prism-AI for your startup business, including example prompts for outreach, marketing, competitor analysis, and customer research.

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Complete deployment instructions for Vercel, self-hosted VPS, and Docker setups.

## Project layout

```
src/
  app/
    page.tsx              # server component: auth gate + loads conversations
    login/page.tsx         # magic-link sign in
    auth/callback/route.ts # completes the magic-link login
    api/chat/route.ts       # the one API route: saves messages, calls Groq
    layout.tsx / globals.css
  components/
    AppShell.tsx            # holds "which conversation is active" state
    Sidebar.tsx              # conversation list + new chat + sign out
    ChatWindow.tsx           # message list + input, auto-creates first chat
    MessageBubble.tsx
    ChatInput.tsx
    AuthForm.tsx
  hooks/
    useChat.ts               # loads history, sends new turns
  lib/
    supabase/{client,server,middleware}.ts
    ai/groq.ts               # the only place that talks to the LLM
    types.ts
  middleware.ts              # keeps the auth session cookie fresh
supabase/schema.sql          # run this once in the Supabase SQL editor
```

## Security

Beyond Supabase's built-in RLS (each user's rows are invisible to every
other user, enforced at the database level, not just in app code), the
`/api/chat` route now also:

- **Validates every field** on the request — rejects malformed roles,
  empty content, oversized messages (>4000 chars), and oversized history
  (>40 messages) before anything touches the database or the model.
- **Rate-limits per user** (12 messages/minute), checked against the
  `messages` table itself rather than in-memory — so it holds up across
  serverless cold starts, and protects your free Groq quota from a bug
  or a runaway script.
- Re-checks conversation ownership server-side on every request (not
  just relying on the client to only ask for its own conversations).

`next.config.mjs` also sets standard security headers (clickjacking,
MIME-sniffing, referrer leakage), and `.gitignore` keeps `.env.local`
(your real keys) out of git — check this before you ever `git push`.

Two things worth doing yourself before relying on this daily:
1. In Supabase, turn **Confirm email** back **on** in production (the
   README earlier suggested disabling it only for local testing).
2. Consider adding [Supabase's leaked-password protection / rate limits
   on auth](https://supabase.com/docs/guides/auth) if you ever add a
   password-based sign-in method alongside magic links.

## Mobile, tablet and desktop

The layout is responsive, not just "shrunk desktop":

- **Phone (<768px):** the sidebar is a slide-in drawer (hamburger menu
  top-left), chat gets the full screen, padding respects the notch/home
  indicator via `env(safe-area-inset-*)`.
- **Tablet/desktop (≥768px):** sidebar is a permanent column, same as
  before.
- `public/manifest.json` lets you "Add to Home Screen" from your
  phone's browser so it opens like an app, full-screen, without the
  browser chrome.

## Using it from your phone right now, no laptop needed

You already have the code on your phone (you're reading this after
downloading it). To get it running as a real, visitable web app without
a computer:

1. **Get the code onto GitHub from your phone.**
   Open github.com in your phone's browser, sign in, create a new
   *empty* repository, then use its "uploading an existing file" link.
   Unzip `prism-ai.zip` first (most phone file managers can extract a
   zip) and upload the extracted folder's contents — most mobile
   browsers can select multiple files at once from your file manager.
2. **Deploy it on Vercel — entirely from the browser.**
   Go to vercel.com, sign in with the same GitHub account, choose
   "Import Project", and pick the repo you just created. Vercel is free
   for personal projects.
3. **Add your environment variables in Vercel's dashboard**, under
   Project Settings → Environment Variables — the same four values from
   your `.env.local` (Supabase URL/key, Groq key/model). Then redeploy.
4. Vercel gives you a public `https://your-project.vercel.app` URL —
   open it on your phone and you're using Prism-AI, no laptop involved.

**If step 1 is awkward on your phone's browser** (uploading a whole
folder structure from mobile can be fiddly), the easier route is:
open **replit.com** on your phone instead, create a new Repl, and use
its file uploader to import `prism-ai.zip` directly — Replit extracts
zips automatically. Add your four env vars in Replit's "Secrets" panel,
then run `npm install && npm run dev` in its built-in mobile-friendly
terminal. Replit gives you a live preview URL immediately — good for
testing today, though for a permanent link you'll still want the
Vercel step above once you're back at a computer.



- **Streaming replies** — Groq supports `stream: true`; swap the fetch in
  `lib/ai/groq.ts` for a streamed response and update the UI to append
  tokens as they arrive, instead of waiting for the full reply.
- **Tool calling** (the thing you shelved on Jarvis over cost) — Groq's
  free tier supports function calling on its larger models, so you can add
  tools (e.g. "check the weather", "search my notes") without a paid API,
  as long as you stay inside the free-tier rate limits.
- **Conversation titles** — right now a new chat is titled from your first
  message. You could ask the model to generate a short title after the
  first exchange and update the `conversations.title` column.
- **Deploying for $0** — Vercel's Hobby tier and Supabase's free tier both
  cover a personal-use app like this at no cost.

## A note on "completely free"

Free-tier limits still exist (Groq's free tier has a requests-per-minute
and tokens-per-day cap; Supabase's free tier has storage/row limits). For
personal use, both are generous enough that you're unlikely to hit them.
Nothing here requires entering payment details anywhere.
