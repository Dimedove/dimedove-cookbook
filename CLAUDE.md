# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a cookbook repository containing independent example applications that demonstrate how to build with the Dimedove Apps API. Each numbered folder is a standalone project.

```
dimedove-cookbook/
├── README.md
├── CLAUDE.md
├── AGENTS.md
└── 00_chat_app/          # Next.js chat application example
    ├── README.md
    ├── package.json
    └── ...
```

## Examples

### 00_chat_app

A full-featured chat application built with Next.js 16, React 19, and the Vercel AI SDK.

**Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Vercel AI SDK

**Development commands** (run from `00_chat_app/`):
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run linting
```

**Environment**: Copy `.env.example` to `.env.local` and fill in your Dimedove credentials.

**Key patterns**:
- App Router with routes under `app/(chat)/` (route group — no `/chat` URL prefix)
- API routes in `app/api/` proxy requests to the Dimedove backend API
- Chat components in `components/chat/` manage conversations, messages, and streaming
- Generative UI via `@json-render/react` renders dynamic forms from the AI backend
- User identification uses a random UUID stored in localStorage (see `chat-layout.tsx`)
- shadcn/ui components in `components/ui/` with neutral styling
- Dark/light theme support via `next-themes`

**Important conventions**:
- Path alias `@/*` maps to the project root
- Components follow shadcn/ui patterns with Radix UI primitives
- The Dimedove API client is in `lib/dimedove-api.ts` (server-side only)
- TypeScript types for the API are in `types/dimedove.ts`

## Documentation

The Dimedove Apps API and platform documentation is available via [Context7](https://context7.com). Coding agents with Context7 MCP support can look up the documentation by searching for **"Dimedove"**.
