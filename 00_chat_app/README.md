# Dimedove Cookbook: Chat App

A full-featured chat application built with the [Dimedove](https://dimedove.com) Apps API. This example demonstrates real-time streaming, conversation history, generative UI (dynamic forms), tool call visualization, internationalization, and dark/light theme support.

## Features

- Real-time streaming chat responses via SSE
- Conversation history with sidebar navigation
- Generative UI — dynamic forms rendered from the AI backend
- Tool call visualization (collapsible display)
- Internationalization (English and French) via next-intl
- Dark / light theme toggle
- Responsive layout with collapsible sidebar
- Brand color customization from your Dimedove dashboard

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or later
- A [Dimedove](https://dimedove.com) account
- An App configured in the [Dimedove dashboard](https://dashboard.dimedove.com) with an API key

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Dimedove credentials

# 3. Start the development server
npm run dev

# 4. Open http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FRONTEND_DOMAIN` | Your app's domain (default: `http://localhost:3000`) |
| `DIMEDOVE_API_BASE` | Dimedove API base URL |
| `DIMEDOVE_APP_ID` | Your App ID from the Dimedove dashboard |
| `DIMEDOVE_API_KEY` | Your API secret key from the Dimedove dashboard |

## Customization

### User Identification

By default, a temporary user ID is generated once and persisted in the browser's `localStorage`. This is defined in [`components/chat/chat-layout.tsx`](components/chat/chat-layout.tsx):

```tsx
const [userId, setUserId] = useState<string>("");

useEffect(() => {
  const key = "dimedove-tmp-user-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  setUserId(id);
}, []);
```

In your production app, replace this with your authenticated user's ID (e.g., from your auth provider, database, session, etc.).

### Branding

Edit [`app/[locale]/(chat)/page.tsx`](app/[locale]/(chat)/page.tsx) to change:

- **`brandName`** — your company or product name (shown in sidebar and welcome screen)
- **`assistantIcon`** — a React node displayed next to assistant messages (optional)
- **`welcomeMessage`** — the greeting shown before the first message
- **`basePath`** — the URL prefix for chat routes (empty string = root)

### Colors

- **App theme**: edit the CSS variables in [`styles/globals.css`](styles/globals.css) to customize the overall look
- **Brand colors**: configure primary and secondary colors in your Dimedove dashboard — they are fetched automatically via the `/api/config` endpoint and applied to generative UI components

### Assets

Add your logo images to the [`assets/`](assets/) directory and import them in [`lib/images.ts`](lib/images.ts).

### Internationalization

The app supports English and French via [next-intl](https://next-intl.dev). Translation files are in [`locales/`](locales/):

- `locales/en.json` — English strings
- `locales/fr.json` — French strings

The locale prefix is hidden from URLs (`localePrefix: "never"` in [`i18n/routing.ts`](i18n/routing.ts)), so routes appear as `/` and `/c/:id` rather than `/en/` or `/fr/`.

## Architecture

```
app/
├── layout.tsx                  Root layout (HTML, body)
├── [locale]/
│   ├── layout.tsx              Locale layout (ThemeProvider, next-intl)
│   └── (chat)/                 Route group (no URL prefix)
│       ├── layout.tsx          Chat layout (TooltipProvider, SidebarProvider)
│       ├── page.tsx            Chat home at / — no active conversation
│       └── c/[conversationId]/ Active conversation at /c/:id
└── api/
    ├── chat/                   Streaming chat endpoint (SSE -> UI message stream)
    ├── config/                 Fetches app config from Dimedove API
    ├── conversations/          Conversation CRUD (list, create, get, update, delete)
    └── metrics/                Fetches app usage metrics from Dimedove API

components/
├── chat/                       Chat UI components
│   ├── chat-layout.tsx         Main orchestrator (conversations, messages, input)
│   ├── chat-sidebar.tsx        Conversation list sidebar
│   ├── chat-input.tsx          Message input with auto-resize
│   ├── chat-messages.tsx       Message list with auto-scroll
│   ├── chat-message.tsx        Individual message (text, tool calls, forms)
│   ├── chat-markdown.tsx       Markdown renderer
│   ├── chat-tool-call.tsx      Collapsible tool call display
│   └── json-render/            Generative UI form rendering system
├── common/                     Shared components
├── navigation/                 Theme toggle
└── ui/                         shadcn/ui components

hooks/
└── use-mobile.ts               Mobile breakpoint detection hook

i18n/
├── navigation.ts               Localized navigation helpers
├── request.ts                  Server-side locale resolution
└── routing.ts                  Locale routing config (en, fr)

lib/
├── dimedove-api.ts             Server-side Dimedove API client
├── images.ts                   Logo/image imports
└── utils.ts                    Tailwind class name utility

locales/
├── en.json                     English translations
└── fr.json                     French translations

middleware.ts                   next-intl locale routing middleware

types/
└── dimedove.ts                 TypeScript types for the Dimedove API
```

### Data Flow

1. User types a message in `ChatInput`
2. `ChatLayout` creates a conversation (if needed) via `POST /api/conversations`
3. Message is sent via the Vercel AI SDK to `POST /api/chat`
4. The API route forwards the message to Dimedove and streams the response back
5. `ChatMessages` renders the streaming response with markdown, tool calls, and forms

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- [Vercel AI SDK](https://sdk.vercel.ai/) (`@ai-sdk/react`, `ai`)
- [JSON Render](https://json-render.com/) (generative UI forms)
- [next-intl](https://next-intl.dev/) (internationalization)
- [next-themes](https://github.com/pacocoursey/next-themes) (dark/light mode)
