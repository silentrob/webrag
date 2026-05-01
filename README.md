# webrag

Fetch a URL with **Playwright**, extract readable article HTML with **Mozilla Readability**, convert to token-efficient **Markdown** with [@kreuzberg/html-to-markdown-node](https://github.com/kreuzberg-dev/html-to-markdown).

Built for **LLM / RAG context**, not crawl-the-whole-site spiders.

## The Problem

Most web pages are useless noise for an LLM. A raw HTML fetch gives you navigation bars, cookie banners, ad slots, footer links, and thousands of tokens of markup before a single sentence of actual content. Simple `fetch` + regex hacks fall apart on JavaScript-rendered SPAs where the real content never exists in the initial HTML response.

**webrag** solves this in three steps:

1. **Renders the page fully** — Playwright drives a real Chromium instance, so React, Vue, and any other JS framework hydrates completely before extraction. A hydration heuristic detects SPAs and waits for content to settle, with an optional selector escape hatch for known layouts.
2. **Extracts only the article** — Mozilla Readability (the same engine Firefox uses for Reader Mode) strips chrome, sidebars, and boilerplate, leaving just the prose.
3. **Converts to token-efficient Markdown** — HTML is converted to clean Markdown, keeping structure (headings, lists, code blocks) while shedding redundant tags. Images and links are optional so you can trim further.

The result is a single string you can drop directly into an LLM prompt or vector store without any further cleaning.

For example, running `webrag https://example.com` produces:

```
This domain is for use in documentation examples without needing permission. Avoid use in operations.

[Learn more](https://iana.org/domains/example)
```

Clean prose, no markup, ready to use.

## Install

```bash
npm install webrag
```

First-time setup for Playwright’s bundled Chromium:

```bash
npx playwright install chromium
```

The Kreuzberg package installs a **platform-specific optional dependency** (e.g. `@kreuzberg/html-to-markdown-node-darwin-arm64`). If `convert` fails at runtime, run `npm install` again or install that package explicitly.

## CLI

After `npm run build`, or when installed from npm:

```bash
webrag https://example.com/page > results.md
```

From the repo without global install:

```bash
npm run build
node dist/cli.js https://example.com/page > results.md
```

Markdown is written to **stdout**; **warnings** and **errors** go to **stderr** so redirection only captures the document.

```bash
webrag --help
```

Flags mirror common API options: `--selector`, `--wait-for`, `--timeout`, `--no-hydration`, `--wait-until`, `--images`, `--no-links`.

## Usage (library)

```typescript
import { fetchPage, warmup, closeBrowser, $fetch } from 'webrag';

await warmup(); // optional: hide cold start of Chromium on first request

const result = await fetchPage('https://example.com/article', {
  waitForSelector: 'article', // optional: faster than networkidle on known layouts
  includeImages: false,       // default: fewer tokens
  includeLinks: true,
});

console.log(result.markdown, result.title, result.warnings);

await closeBrowser(); // when shutting down the process
```

### Options (summary)

| Option | Default | Purpose |
|--------|---------|---------|
| `waitUntil` | _(auto)_ | Force a single `goto` wait (`load` / `domcontentloaded` / `networkidle`); skips hydration heuristics. |
| `detectHydration` | `true` | After `domcontentloaded`, may wait for `networkidle` or `waitForSelector` if the page looks like an SPA or body text is still sparse. |
| `waitForSelector` | — | If hydrate wait is needed, wait for this selector instead of `networkidle`. |
| `blockResources` | `image`, `font`, `media`, `stylesheet` | Abort heavy assets before navigation; set `[]` to load everything. |
| `selector` | — | Scope HTML to a CSS selector before Readability. |
| `readability` | `true` | Use Readability; if it fails, fall back to `body` HTML. |
| `includeImages` | `false` | Strip images for smaller prompts. |
| `includeLinks` | `true` | Set `false` to unwrap anchors to plain text. |
| `includeMetadata` | `true` | Populate `title`, `excerpt`, `byline`, etc. |

`$fetch` from **ofetch** is re-exported for non-browser HTTP helpers.

## Scripts

- `npm run build` — compile with `tsup` to `dist/` (ESM + CJS + types)
- `npm test` — `npm run build` then Vitest (unit tests + CLI `--help` smoke check)

## License

MIT
