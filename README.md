# local-operator-docs

The documentation site for [Local Operator](https://local-operator.com) — guides for the
TUI, the desktop app, workflow automations, remote access and the Python SDK.

Built with Next.js + Tailwind, deployed on Railway at **https://docs.local-operator.com**.

> This repository is the documentation site only. The agent runtime lives in
> [`damianvtran/local-operator`](https://github.com/damianvtran/local-operator); the desktop app
> in [`damianvtran/local-operator-ui`](https://github.com/damianvtran/local-operator-ui).

## Development

```bash
pnpm install        # Node 22.13.1 (.nvmrc), pnpm pinned in package.json
pnpm dev            # http://localhost:3000 — predev regenerates the search index first
```

## Quality gates

```bash
pnpm lint           # Biome (format + lint) plus scripts/check-design-system.mjs
pnpm check-types    # tsc --noEmit
pnpm test           # vitest: tokenizer, scorer, snippets, nav/content consistency
pnpm build          # prebuild: search index + design-system check, then next build
```

## Content: adding a page

1. Create `content/<slug>.md` with frontmatter:
   `description`, `section` (a nav group id), `order` (1-based position in the group);
   optional `title` (defaults to the first H1), `tags`, `draft`.
2. Register the page in `src/lib/nav.ts` — same slug, same group, same order.
3. That is all: the sidebar, pager, breadcrumbs, sitemap and search index all
   derive from those two sources, and **the build fails when they diverge**
   (an unregistered file, a wrong section, an order mismatch).

A page with `draft: true` is routable and searchable but hidden from the
sidebar, pager and `llms.txt`; it renders with a "Preview" chip in palette
results. Any nav registry entry without a content file renders as "Planned"
and links nowhere — nothing 404s.

## Search

The search engine is ours (no search library): `src/lib/search/` holds the
tokenizer (identifier-aware, stemmer-lite), the field-weighted scorer
(exact > prefix > one-edit typo, phrase bonus, deterministic ties), snippet
extraction and a synonym map ("phone" → mobile relay).

- `pnpm generate-search-index` writes `public/search-index.json` (per-page and
  per-section entries, pre-tokenized). It runs in `predev` and `prebuild`, so
  a stale or missing index cannot silently answer every query with nothing.
- The palette (`⌘K`, `/`, or the top-bar button) layers ACTIONS ("Install
  Local Operator" copies the command) over PAGES and SECTIONS, and `g`-chords
  (`g t` → Terminal, `g d` → Desktop) navigate without the mouse. Press `?`
  for the shortcut sheet.

## Design system

- Colour values live in exactly two places: `src/styles/palettes.css` (the
  brand light/dark palettes, copied from `local-operator-ui`'s generated
  theme file) and `src/lib/shiki-theme.ts` (the syntax themes). Everything
  else reads role utilities — `bg-surface`, `text-ink-muted` — and
  `scripts/check-design-system.mjs` fails the lint/build if a hex colour, a
  raw Tailwind palette class or an `outline: none` appears in component code.
- Light/dark/system theming is pre-paint (an inline script in
  `src/app/layout.tsx` sets `data-theme` before first render) plus a top-bar
  menu. Code blocks use Shiki's dual-theme output, so the palette switch
  needs no re-highlighting.

## Agent-readable endpoints

- `/llms.txt` — every published page with a one-line description.
- `/raw/<slug>` — a page's markdown source (the "Copy page" button fetches it).
- `/search-index.json` — the full search index.

## Deployment

Railway builds with `nixpacks.toml` (Node 22.13.1, `pnpm install
--frozen-lockfile`, `pnpm build`, `pnpm start`). CI runs lint, typecheck,
tests and a production build on every push.
