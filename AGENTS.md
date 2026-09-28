# Working on local-operator-docs

The documentation site for Local Operator — guides for the terminal UI, the
desktop app, the mobile relay, the browser extension, workflow automations,
exec mode, the Python SDK and the wider ecosystem. Deployed at
**https://docs.local-operator.com** (Railway), source on GitHub
(`damianvtran/local-operator-docs`).

This file is the maintenance guide: what the parts are, how the generated
artifacts stay in sync with the content, and the exact commands the repo's
gates run. Read it before changing anything structural.

> This repository is the documentation site only. The agent runtime lives in
> `damianvtran/local-operator` (Python, CLI, server); the desktop app in
> `damianvtran/local-operator-ui` (Electron + React).

## Repo map

| Path | What lives there |
| --- | --- |
| `content/**/*.md` | Every page, as Markdoc markdown with frontmatter. The only place prose is written. |
| `src/lib/nav.ts` | The single navigation registry: every page's id, sidebar label and slug, grouped in display order. |
| `src/lib/content.ts` | The loader: `content/` × `nav.ts`, validated — the build **fails** when the two disagree (unregistered file, wrong `section`, wrong `order`, duplicate slug). |
| `src/lib/markdoc-config.ts` | Markdoc schema + component map: the custom tags (`figure`, `diagram`, `callout`, `steps`, `tabs`, `cards`, `columns`, `kbd`, `command`) and how markdown nodes render. |
| `src/lib/site.ts` | The facts every surface shares: name, URL, GitHub links, install command, social-card path, fallback versions. |
| `src/lib/structured-data.ts` | The JSON-LD builders (WebSite / SoftwareApplication / TechArticle / BreadcrumbList). |
| `src/lib/versions.ts`, `src/lib/built-versions.ts`, `src/lib/use-version-refresh.ts` | The version pipeline (see "Versions" below). |
| `src/lib/llms-full.ts` | The `/llms-full.txt` document builder. |
| `src/lib/search/` | The search engine: tokenizer, scorer, snippets, synonyms. |
| `src/app/` | App Router routes: `(docs)/[...slug]` content pages, `page.tsx` home, `llms.txt` + `llms-full.txt` + `raw/[...slug]` route handlers, `sitemap.ts`, `robots.ts`, `layout.tsx` (shell, metadata, pre-paint theme script). |
| `src/components/` | `layout/` (top bar, sidebar, footer, TOC, pager, breadcrumbs, version chip), `ui/` (figure, code block, callout, …), `search/`, `diagrams/`, `theme/`. |
| `scripts/` | `generate-search-index.ts`, `generate-versions.ts`, `check-design-system.mjs`. |
| `tests/` | Vitest: content/nav consistency, search, llms-full completeness, semantic structure (H1 + heading order), structured data, versions, figure alignment. |
| `public/` | Committed assets (`public/shots/**` screenshots, `public/og.png` social card). `search-index.json` and `versions.json` are generated and gitignored. |

Stack notes that shape expectations: **Next.js 15 App Router** with fully
static rendering (no server data at request time); **Markdoc** for content
(not MDX — no JSX in prose); **Tailwind v4** configured in CSS
(`@theme` in `src/app/globals.css`) with no `tailwind.config`; **Radix/shadcn**
primitives under `src/components/ui` (`components.json`); **Biome** for lint
and format (not ESLint/Prettier); **Geist Mono** via `next/font`.

## Adding content

**A page:**

1. Create `content/<group>/<slug>.md` with frontmatter:
   - `description` (required — one sentence, ~120–160 chars; it becomes the
     meta description, the palette snippet and the home tile copy);
   - `section` (required — must equal the nav group id, e.g. `get-started`);
   - `order` (required — must equal the item's 1-based position in the group);
   - optional: `title` (defaults to the page's first H1), `tags`,
     `draft: true`.
2. Register the item in `src/lib/nav.ts` — same slug, same group, in position.
3. That's all. Sidebar, pager, breadcrumbs, sitemap, `llms.txt`,
   `llms-full.txt` and the search index all derive from those two sources.

**A whole section:** add a group to `NAV` in `src/lib/nav.ts` (`id` must match
each page's `section` frontmatter), then the pages as above. Nothing else —
the sidebar, footer and home page read the registry, never a hardcoded list.

**Drafts and planned pages:**

- `draft: true` → routable, searchable, renders with a "Preview" chip, linked
  from the home page as a preview; **excluded** from the sidebar, pager,
  sitemap, `llms.txt` and `llms-full.txt`.
- A registry entry with no content file → "Planned": shown on the home page
  as a non-link tile, nowhere else, and it 404s nowhere because it never
  links.

**Writing rules the tests enforce** (`tests/semantic-structure.test.ts`):
exactly one H1 per page (it opens the page); no heading-level skips (an H2
before any H3); keep descriptions unique across pages.

## Generated artifacts

| Artifact | Produced by | When | How to verify |
| --- | --- | --- | --- |
| `public/search-index.json` | `pnpm generate-search-index` (`src/lib/search/index-gen.ts`) | `predev` + `prebuild` | `pnpm test` (completeness test); the script fails loudly on an empty index |
| `public/versions.json` | `pnpm generate-versions` (`scripts/generate-versions.ts`) | `prebuild` | printed at build; `curl localhost:3000/versions.json` on a built site |
| `/llms.txt` | `src/app/llms.txt/route.ts` (nav × content, published only) | build (static) | `curl` it on a built site |
| `/llms-full.txt` | `src/lib/llms-full.ts` via its route (full bodies, nav order) | build (static) | `tests/llms-full.test.ts` (every published page once; no drafts) |
| `/raw/<slug>` | `src/app/raw/[...slug]/route.ts` (the page's markdown source) | build (static) | "Copy page" button; `curl /raw/getting-started/install` |
| `/sitemap.xml`, `/robots.txt` | `src/app/sitemap.ts`, `src/app/robots.ts` | build (static) | `curl`; sitemap lists published pages only and deliberately carries no `lastmod` (content has no dates, and filesystem mtimes change on every checkout) |
| JSON-LD (`WebSite` + `SoftwareApplication` on home; `TechArticle` + `BreadcrumbList` on docs pages) | `src/lib/structured-data.ts`, rendered via `src/components/ui/json-ld.tsx` | build | `tests/structured-data.test.ts`; parse the emitted `<script type="application/ld+json">` blocks |
| `public/og.png` (1200×630 social card) | Rendered once from a small HTML card via headless Chrome; committed | by hand, when branding changes | `curl -I /og.png`; check in a social preview debugger |

Never commit the gitignored generated files: they are rebuilt per build, and a
stale committed copy is exactly the drift the generators exist to prevent.

## Quality gates

```bash
pnpm lint          # biome check . && node scripts/check-design-system.mjs
pnpm check-types   # tsc --noEmit
pnpm test          # vitest run
pnpm build         # prebuild (generate-versions + generate-search-index + design check), then next build
```

CI (`.github/workflows/ci.yml`) runs all four on every PR and every push to
`main`. Railway runs `pnpm build` + `pnpm start` on deploy; if it fails, the
previous deployment stays live.

## Design essentials

- **Tokens.** Colour arrives as `var(--lo-*)` from `src/styles/palettes.css`
  (per theme, generated from the app's palettes); everything else (type,
  space, radii, motion) lives in the `@theme` block of
  `src/app/globals.css`. Components read **role utilities** — `bg-surface`,
  `text-ink-muted`, `border-hairline` — never hexes or Tailwind palette
  classes; `scripts/check-design-system.mjs` fails on any violation, plus on
  `outline: none` anywhere (focus indication is not removable).
- **Themes** are `data-theme` (`localOperatorLight` / `localOperatorDark`), set
  before first paint by an inline script in `src/app/layout.tsx`, toggled from
  the top bar. Shiki code blocks carry both palettes, so switching needs no
  re-highlighting.
- **Fonts.** Sans is deliberately the OS UI stack; mono is Geist Mono via
  `next/font` (`src/app/fonts.ts`).
- **The article grid** (`src/app/globals.css`, `.docs-article`): ONE measure —
  every direct child (prose, headings, code blocks, callouts, steps, tabs,
  tables, figures) renders in the same `var(--container-measure)` reading
  column, left and right edges flush. There is deliberately no wider
  `bleed`/`full` track: a component that takes a second measure is the defect
  this layout removed (fix/content-measure — code, callouts and tables
  rendered 6rem wider than the prose on each side). Content that cannot fit
  scrolls inside the column (`ScrollRegion` for tables). The alignment rule
  is enforced in `tests/figure-alignment.test.ts` (figures, diagrams, and the
  other content components), on the rendered markup.
- **The home page** is banded marketing (full-width containers by design):
  the hero figure spans its band, aligned with the tile grids below it.

## Screenshots

- **TUI screenshots** (`public/shots/tui/*.png`) come from the runtime repo's
  own capture tooling under an **isolated HOME/config** — never from the
  operator's live setup. The recipe lives in the runtime repo's `AGENTS.md`
  ("Visual validation"); follow it rather than photographing a live session.
- **Desktop-app screenshots** (`public/shots/ui/*.webp`) come from the UI
  repo's capture machinery: a Storybook story driving the real components
  over fixtures, photographed by a private headless Chrome over CDP
  (`scripts/capture-evidence.mjs`; `--use-mock-keychain`, throwaway profile),
  or the headless-Electron driver (`docs/agent-driver.md` there). Never a
  hand-drawn mock — if a scene does not exist as a story, add one there first.
- **The home hero** is captured at 1280×900 CSS pixels with a 2× device scale
  factor → a 2560×1800 WebP pair (light + dark). If the aspect changes, update
  the `Figure` `width`/`height` reservations on the home page in the same
  commit — they exist so the above-the-fold image does not shift the page on
  load.
- Captures must leave nothing running and nothing on screen (headless, reaped);
  temp profiles belong outside the repo.

## Versions

The version chip (top bar) and the footer note pull the latest release
automatically — **there is no release sweep and no manual bump**:

1. `pnpm build` runs `scripts/generate-versions.ts`, which resolves the latest
   release of `damianvtran/local-operator` (the chip) and
   `damianvtran/local-operator-ui` (the app, for download surfaces), in order:
   GitHub Releases (`/releases/latest`) → PyPI (`pypi.org/pypi/local-operator`)
   → the fallback constants in `src/lib/site.ts`. It writes
   `public/versions.json`. **A fetch failure never fails the build** — it
   warns and writes the fallbacks.
2. The server renders the chip's first paint from that file
   (`src/lib/built-versions.ts`), so the static HTML always carries a value.
3. After hydration, `src/lib/use-version-refresh.ts` re-checks
   `/versions.json` and GitHub directly (4s timeout, `sessionStorage` cache
   with a 6-hour TTL, one request per document) and moves the chip **only
   forward**, to a newer semver. Failures are console warnings, never UI.

Checking the live values:

```bash
curl -s https://api.github.com/repos/damianvtran/local-operator/releases/latest | jq -r .tag_name
curl -s https://pypi.org/pypi/local-operator/json | jq -r .info.version
curl -s https://docs.local-operator.com/versions.json
```

(GitHub's unauthenticated limit is 60 requests/hour per IP; a rate-limited
build warns and falls back — that is normal, not broken.)

## Deployment

- **Railway**, service **`local-operator-docs`**, auto-deploys on every push
  to `main`. Build via `nixpacks.toml`: Node 22.13.1,
  `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm start`. The
  `--frozen-lockfile` means a lockfile that disagrees with `package.json` fails
  the deploy rather than silently resolving something new.
- **CLI**: `railway status` (project/service/link state), `railway logs`
  (build + runtime). Link a checkout once with `railway link` if the CLI asks.
- **Domain**: `docs.local-operator.com` is a proxied Cloudflare CNAME pointing
  at the Railway service; TLS terminates at Cloudflare. DNS changes belong in
  Cloudflare, deploy changes in Railway.
- **Merge order**: CI (GitHub Actions) must be green before `main` moves.

## Conventions

- Conventional commits (`feat(site): …`, `fix(seo): …`); comments in code
  explain **why** and the constraint, never the what.
- No absolute paths to anyone's home directory in any file in this repo, and
  no personal details — it is public.
- When a pipeline changes, this file changes with it.
