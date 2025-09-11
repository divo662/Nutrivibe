# NutriVibe Naija — AI‑Powered Nigerian Meal Planning

Personalized, culturally authentic meal planning for Nigerian cuisine. Generate meal plans, recipes, nutrition breakdowns, and shopping lists with AI. Export to PDF, share plans, and analyze macros — all optimized for local dishes and ingredients.

## ✨ Features
- AI meal planning tuned for Nigerian cuisine (breakfast, lunch, dinner, snacks)
- Smart recipe recommendations and substitutions
- Calorie and macro targets with nutrition summaries
- One‑click shopping list generation (by aisle/category)
- PDF/image export of plans and lists
- Plan analytics and trends
- Plan sharing (copy/shareable views)
- Voice command input (optional)
- Subscription & usage tracking via Stripe + Supabase

## 🧰 Tech Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Database, Edge Functions)
- Stripe (subscriptions, webhooks)
- Groq/OpenAI‑compatible AI service layer

## 📦 Project Structure
```
src/
  components/           # UI components (dashboard, ai, layout, ui/*)
  pages/                # Routes (Dashboard, Settings, AI pages)
  services/             # Business logic, AI, exports, subscriptions
  integrations/         # Supabase client and generated types
  contexts/             # React contexts (subscription, etc.)
supabase/
  functions/            # Edge functions (Stripe checkout, webhook, etc.)
  migrations/           # SQL migrations (usage tracking, content tables)
public/                 # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase project (free tier is fine)
- Stripe account (for subscription flows)

### 1) Install dependencies
```sh
npm install
```

### 2) Environment variables
Create a `.env` file in the project root.

```bash
# Web app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI provider (example: Groq, OpenAI-compatible)
VITE_AI_API_BASE=https://api.groq.com
VITE_AI_MODEL=mixtral-8x7b-32768   # or your chosen model
VITE_AI_API_KEY=your_ai_key

# Stripe (frontend)
VITE_STRIPE_PUBLIC_KEY=pk_live_or_test

# Optional: app settings
VITE_APP_ENV=development
```

For Supabase Edge Functions (server-side), also configure the secrets for Stripe and any server AI keys via Supabase CLI or dashboard.

### 3) Configure Supabase
Generate a service role key in Supabase, then run migrations locally or apply them via the dashboard.

Migrations relevant to subscriptions and AI usage are in `supabase/migrations/`. To run them locally with the Supabase CLI:

```sh
# Install Supabase CLI if needed
npm i -g supabase

# Start local dev stack (if you want to run locally)
supabase start

# Apply migrations
supabase migration up
```

If you manage your database via the Supabase web UI, open each SQL file in `supabase/migrations/` and run in order.

### 4) Configure Stripe
Set your webhook endpoint(s) in Stripe to the deployed Supabase Edge Function URL or local tunnel.

Edge functions in this repo:
- `stripe-create-checkout`
- `stripe-verify-session`
- `stripe-cancel-subscription`
- `stripe-webhook`

Deploy functions via Supabase:
```sh
supabase functions deploy stripe-create-checkout
supabase functions deploy stripe-verify-session
supabase functions deploy stripe-cancel-subscription
supabase functions deploy stripe-webhook
```

Set required environment variables for these functions (in Supabase):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Any app‑specific settings used in the function code

### 5) Run the app
```sh
npm run dev
```

The app will start on `http://localhost:8080` (see `vite.config.ts`).

## 🔌 AI Configuration
The AI layer is under `src/services/ai/`. You can point it at Groq or any OpenAI‑compatible base URL.

Key files:
- `src/services/ai/core.ts`: client and request orchestration
- `src/services/ai/*-service.ts`: domain logic (meal plan, recipes, shopping list, nutrition)
- `src/services/ai/types.ts`: shared types

Environment variables (frontend): see `.env` section above for `VITE_AI_*` keys.

## 🧪 Scripts
- `npm run dev` — start dev server
- `npm run build` — build for production
- `npm run preview` — preview production build
- `npm run lint` — run ESLint

## 🖨️ Exports
- `src/services/pdfExportService.ts` — PDF generation
- `src/services/imageExportService.ts` — image export

## 🔐 Authentication & Subscriptions
- Supabase Auth is used for sessions and profile storage
- Subscription state and AI usage are tracked in Supabase tables
- Stripe handles checkout, verification, cancellation, and webhooks via Edge Functions

## 📄 Environment & Secrets Checklist
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLIC_KEY`
- `VITE_AI_API_BASE`, `VITE_AI_MODEL`, `VITE_AI_API_KEY`
- Supabase Function secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## 📦 Deployment
You can deploy the frontend to Vercel, Netlify, or any static hosting that supports Vite builds.

General steps:
1. Set environment variables in your hosting provider (all `VITE_*` keys)
2. Build with `npm run build`
3. Serve the `dist/` directory
4. Deploy Supabase Edge Functions and set secrets for Stripe
5. Configure Stripe webhooks to point to your deployed function URL

## 🧭 Contribution
Issues and PRs are welcome. Please:
1. Create a feature branch
2. Add clear descriptions and minimal reproducible steps
3. Keep code readable and typed; match existing formatting

## 📝 License
MIT — see `LICENSE` if present, otherwise include one when publishing.

## 🙏 Acknowledgements
- Nigerian food community and resources inspiring the dataset and defaults
- Open‑source libraries listed in `package.json`
