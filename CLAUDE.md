# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A browser-based ADA accessibility testing toolkit with 6 tools: Color Contrast Checker, HTML Validator, WCAG 2.1 Checklist, Typography Checker, PDF File Analyzer, and a Resources page. The client-side tools run entirely in the browser with vanilla JS; the PDF Analyzer requires server-side AI APIs (Anthropic, OpenAI, or Google Gemini) via Vercel serverless functions.

## Project structure

```
index.html              → Single-page UI shell (8 page sections, all hidden/shown via JS)
app.js                  → All client-side logic (~1,550 lines, single IIFE)
styles.css              → All styling (~1,890 lines, CSS custom properties, light/dark themes)
api/
  providers.js          → Shared AI provider routing (Anthropic/OpenAI/Gemini), system prompts
  analyze.js            → Vercel serverless: PDF analysis endpoint
  generate.js           → Vercel serverless: accessible HTML generation endpoint
server/
  server.js             → Local Express dev server (mirrors Vercel API routes + rate limiting)
  package.json          → Server-only deps (express, cors, dotenv)
package.json            → Root deps (AI SDKs only: @anthropic-ai/sdk, openai, @google/generative-ai)
vercel.json             → Vercel function config (120s timeout per function)
```

## Running locally

**Client-side tools only (no server needed):**
Open `index.html` directly in a browser. Color Contrast, HTML Validator, WCAG Checklist, and Typography Checker all work offline.

**PDF Analyzer (requires server):**
```bash
cd server
npm install
# Create .env with API key (see server/.env.example)
npm start
# Runs on http://localhost:3001, serves frontend + API routes
```

**Production deployment:**
Deployed to Vercel. `api/*.js` files are auto-detected as serverless functions. API keys are provided by the user at runtime (not stored server-side).

## Architecture (app.js)

The app is a single IIFE. On `DOMContentLoaded`, eight init functions run sequentially:

```
initNavigation()      → Page routing via data-page/data-goto attributes
initTheme()           → Dark mode toggle, persisted to localStorage
initMobileNav()       → Sidebar drawer for <768px
initContrastChecker() → Color parsing, WCAG ratio calc, suggestions
initValidator()       → HTML scanning (11 rule categories)
initChecklist()       → 50 WCAG criteria, localStorage persistence
initTypography()      → Real-time typography evaluation
initFileAnalyzer()    → PDF upload, AI analysis, HTML generation
```

**Navigation system:** Sidebar buttons have `data-page="<name>"` matching `<section id="page-<name>">`. Dashboard cards use `data-goto="<name>"`. Adding a new page only requires the HTML section + nav button — no JS routing changes needed.

**State management:** Purely DOM-driven. No app-wide state object. Persistence uses localStorage for: theme (`ada-toolkit-theme`), checklist (`ada-toolkit-checklist`), API keys (`ada-toolkit-api-key-{provider}`).

**Utility helpers:** `$(sel)` / `$$(sel)` are querySelector wrappers. `announce(msg)` pushes text to an aria-live region for screen readers.

## API layer (api/providers.js)

`callProvider()` is the single entry point for all AI calls. It accepts `{ provider, model, apiKey, systemPrompt, userMessage, maxTokens }` and routes to the correct SDK. Two system prompts are exported: `ANALYSIS_SYSTEM_PROMPT` (returns JSON with issues array) and `GENERATION_SYSTEM_PROMPT` (returns complete HTML5 document). Error formatting handles 401/403/404/429 status codes with user-friendly messages.

## Key constraints

- **No build step** — vanilla JS/CSS, no bundler, no transpilation.
- **No external CSS/fonts** — everything is self-contained except PDF.js (CDN).
- **Accessibility-first** — all interactive elements need ARIA attributes, focus management, and keyboard support. Use `textContent` for user-facing text (never `innerHTML` with user data). Screen reader announcements go through `announce()`.
- **Dark mode** — all new UI must work in both themes. Use CSS custom properties (e.g. `var(--bg-card)`, `var(--text-primary)`), never hardcoded colors.
- **Mobile responsive** — sidebar collapses to drawer at 768px. New layouts need responsive breakpoints.
- **DOM XSS prevention** — user/file content rendered via `textContent` or `escapeHtml()`.

## Testing

No automated test suite. Manual verification:
1. Open `index.html` in Chrome/Edge/Firefox
2. Confirm no console errors
3. Test each tool's functionality
4. Verify dark mode toggle works on all pages
5. Test mobile layout (<768px viewport)
6. For PDF Analyzer: run the local server and test with a real PDF

## styles.css organization

CSS is organized in numbered sections: Custom Properties (1), Base Reset (2), Accessibility Utilities (3), Header (4), Navigation (5), Pages (6), Dashboard (7), Color Contrast (8), HTML Validator (9), WCAG Checklist (10), Typography (11), Resources (12), File Analyzer (13a), User Guide (13b), Responsive (13), Motion/Accessibility (14), Print (15). New tool pages should follow this pattern and include dark mode overrides via `[data-theme="dark"]` custom property values defined at the top.
