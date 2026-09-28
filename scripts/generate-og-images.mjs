// Renders the per-page social share cards — the image every unfurl of a docs
// URL shows on X, LinkedIn, Slack, Discord, iMessage and Facebook — and writes
// them into `public/og/`.
//
//   pnpm build && pnpm start -p 3855        # in one shell
//   pnpm og                                 # in another
//
// Run it whenever a page's title, description or section changes. Output is
// committed, so a normal build never runs it; the same contract as the
// marketing site's `pnpm og` (scripts/generate-og-image.mjs there), whose
// system this mirrors.
//
// ---------------------------------------------------------------------------
// Why a generator rather than a hand-made PNG per page
// ---------------------------------------------------------------------------
//
// A share card is the part of the site most people see first, and a hand-made
// card is stale the moment the page it depicts moves. This one reads every
// page live, so it owns no copy at all:
//
//   - the title out of the page's single `<h1>` (the SEO pass guarantees one);
//   - the description out of `<meta name="description">` — the same deck-owned
//     string the page renders and search engines read;
//   - the section chip out of the breadcrumb's group item, or the home
//     eyebrow (`#home-eyebrow`) on the root page;
//   - the wordmark out of the top bar's brand link, SVG included;
//   - the URL out of the page's own `<link rel="canonical">`;
//   - every colour out of the light palette variables the page resolved
//     (`--lo-*`), with the theme pinned to light first;
//   - and the mono webfont URL out of the page's own `@font-face` rule, so
//     the card sets its machine voice in the same file the site does.
//
// The page list is the running build's own `/sitemap.xml`: published pages
// only, so a draft cannot get a card, and a newly published page is one
// sitemap entry away from getting one.
//
// ---------------------------------------------------------------------------
// Why the filename carries a hash — of the card's inputs, not its pixels
// ---------------------------------------------------------------------------
//
// Unfurl caches key on the image URL: replacing the bytes under a stable name
// leaves the old card unfurling for as long as the platform holds it. A
// hashed name makes every CHANGED card a URL no scraper has ever seen, which
// removes the image-cache layer entirely. The page card cache — whether a
// platform re-reads the tags at all — is NOT removed by the hash; the
// per-platform purge steps are in README.md under "Share cards".
//
// The hash covers what the card was MADE OF — the page strings it reads plus
// `CARD_TEMPLATE_VERSION` — and not the PNG's bytes, because those bytes are
// not reproducible: two renders of one card, same Chrome, same inputs, differ
// by a handful of ±1 anti-aliasing samples (measured: 8 of 2.27M raw bytes
// after the downsample). A byte hash would therefore rename every card on
// every regeneration and invalidate every unfurl for no visible change. With
// an inputs hash, stable content keeps stable names, and a card whose file
// already exists is SKIPPED rather than re-rendered — `--force` re-renders
// everything regardless.
//
// ---------------------------------------------------------------------------
// Why old cards are kept
// ---------------------------------------------------------------------------
//
// A hashed name means every regeneration orphans a URL, and a share published
// before the deploy renders a white box once its image 404s. So the sweep
// below deletes only cards git has never seen — the intermediates from
// iterating locally — and everything committed stays. A failed `git` is not
// "nothing is committed": the sweep stops rather than risking deletion of
// cards production may be serving.
//
// ---------------------------------------------------------------------------
// Why 1200x630, rendered at 2x and downsampled
// ---------------------------------------------------------------------------
//
// 1200x630 is the size every platform documents and the size the metadata
// declares in og:image:width/height. A card rendered natively at 1200 has 1x
// glyph edges, so Chrome paints at deviceScaleFactor 2 and ffmpeg resolves the
// 2400px result down by box-averaging each 2x2 quad (`scale=...:flags=area`),
// which is what supersampling means at an exact integer reduction. The card
// document itself owns its colours (light palette values are baked in), so its
// output does not depend on the viewer's or the machine's colour scheme.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { findChrome, launchChrome, openPage, settle } from "./lib/chrome.mjs";
import { CARD_TEMPLATE_VERSION } from "./lib/og-card-template.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_OG = join(ROOT, "public", "og");
const MODULE = join(ROOT, "src", "data", "og-cards.ts");
const args = process.argv.slice(2);

/**
 * The first argument that is not a flag is the origin; `--force` may sit
 * before or after it. Reading `argv[2]` blindly made the flag itself the
 * origin — `pnpm og --force` crashed with `ERR_INVALID_URL:
 * '--force/sitemap.xml'` (QA round 1, Q1), while pnpm forwards the flag
 * positionally and the README advertises the flag as-is.
 */
const FORCE = args.includes("--force");
const origin = (
	args.find((arg) => !arg.startsWith("-")) ?? "http://localhost:3855"
).replace(/\/$/, "");

/** The card, in CSS pixels. Also the numbers the metadata declares. */
const CARD = { width: 1200, height: 630 };
/** Supersampling factor: the DPR of the displays a feed is read on. */
const SCALE = 2;

const fail = (message, code = 2) => {
	console.error(`generate-og-images: ${message}`);
	process.exit(code);
};

// A failed run must not leave a browser or a temp dir behind. `fail()` calls
// process.exit, which skips the happy path's `close()` — measured: a crashed
// run left a live headless Chrome, its profile under the caller's tmpdir, and
// the ffmpeg work dir (review round 1, minor 2 — six profiles and four live
// browsers had accumulated across three failed runs). The `exit` hook runs on
// every path that exits through Node, and the signal handlers cover Ctrl-C.
let browser = null;
let work = null;
const teardown = () => {
	if (browser) {
		browser.kill();
		browser = null;
	}
	if (work) {
		rmSync(work, { recursive: true, force: true });
		work = null;
	}
};
process.on("exit", teardown);
for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => {
		teardown();
		process.exit(130);
	});
}

// `spawnSync` returns `status: null` when the binary is missing entirely, so
// this tests for "exited zero" rather than for a truthy error.
if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0) {
	fail("ffmpeg not found. `brew install ffmpeg`.");
}

const chromePath = findChrome();
if (!chromePath) {
	fail(
		"no Chrome binary found.\n" +
			"Set CHROME_PATH, or install one (`npx playwright install chromium`).",
	);
}
console.log(`browser: ${chromePath}`);
console.log(`origin:  ${origin}`);

// ---------------------------------------------------------------------------
// The page list: the running build's own sitemap.
// ---------------------------------------------------------------------------

const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
if (!sitemapResponse.ok) {
	fail(
		`${origin}/sitemap.xml answered ${sitemapResponse.status}. ` +
			"The page list is read from the build's own sitemap; start the site first (`pnpm start -p 3855`).",
	);
}
const sitemap = await sitemapResponse.text();
const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
	(match) => new URL(match[1]),
);
if (routes.length < 2) {
	fail(`the sitemap yielded ${routes.length} routes; that is not a site.`);
}
console.log(`routes:  ${routes.length} (from /sitemap.xml)`);

/** `/getting-started/install` -> `getting-started-install`; `/` -> `home`. */
const slugFor = (pathname) =>
	pathname === "/"
		? "home"
		: pathname.replace(/^\/|\/$/g, "").replaceAll("/", "-");

// ---------------------------------------------------------------------------
// Read every page.
// ---------------------------------------------------------------------------

browser = await launchChrome(chromePath, {
	windowSize: { width: CARD.width, height: CARD.height },
});
const reader = await openPage(browser);

await browser.send(
	"Emulation.setDeviceMetricsOverride",
	{ width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
	reader.sessionId,
);

/**
 * What one page contributes to its card, read live.
 *
 * The theme is pinned to light BEFORE any token is read: the site resolves its
 * palette from `data-theme`, whose default is the dark one, and a card that
 * inherited that would ship near-black for half the fleet and warm paper for
 * the other half depending on nothing at all.
 */
const READ_PAGE = `(() => {
	const strip = (html) => {
		const el = document.createElement('div');
		el.innerHTML = html;
		return el.textContent.replace(/\\s+/g, ' ').trim();
	};

	document.documentElement.dataset.theme = 'localOperatorLight';

	const heading = document.querySelector('main h1, h1');
	const meta = document.querySelector('meta[name="description"]');
	const brand = document.querySelector('header a[aria-label="Local Operator home"]');
	const canonical = document.querySelector('link[rel="canonical"]');
	if (!heading || !meta || !brand || !canonical) {
		return { missing: [
			heading ? null : 'main h1',
			meta ? null : 'meta[name=description]',
			brand ? null : 'header brand link',
			canonical ? null : 'link[rel=canonical]',
		].filter(Boolean) };
	}

	// The section chip: the breadcrumb's group item on a docs page, the
	// eyebrow on the root page. A group-bearing breadcrumb lists exactly five
	// items — Docs / / / group / / / title — so the group is items[2] and a
	// shorter list means no group (the title must never be read as one).
	const crumbs = [...document.querySelectorAll('nav[aria-label="Breadcrumb"] li')]
		.map((li) => strip(li.innerHTML));
	const eyebrow = document.querySelector('#home-eyebrow');
	const chip = eyebrow ? strip(eyebrow.innerHTML) : crumbs.length === 5 ? crumbs[2] : '';

	const brandSpans = [...brand.querySelectorAll('span')].map((span) => strip(span.innerHTML));
	const brandSvg = brand.querySelector('svg')?.outerHTML ?? null;
	if (!brandSvg || brandSpans.length < 2) return { missing: ['brand lockup (svg + two name spans)'] };

	const styles = getComputedStyle(document.documentElement);
	const token = (name) => styles.getPropertyValue(name).trim();

	// The mono webfont URL, out of the page's own @font-face rule. next/font
	// serves it from a hashed path this script must not hardcode; a renamed
	// asset is a loud failure below rather than a card in the wrong typeface.
	let monoUrl = null;
	for (const sheet of document.styleSheets) {
		let rules;
		try { rules = sheet.cssRules; } catch { continue; }
		for (const rule of rules) {
			if (rule instanceof CSSFontFaceRule && /GeistMono/i.test(rule.cssText)) {
				const src = rule.style.getPropertyValue('src');
				const url = src.match(/url\\(([^)]+)\\)/);
				if (url) monoUrl = new URL(url[1].replace(/["']/g, ''), location.origin).href;
			}
		}
	}

	return {
		title: strip(heading.innerHTML),
		description: strip(meta.getAttribute('content') ?? ''),
		chip,
		brand: { svg: brandSvg, name: brandSpans[0], suffix: brandSpans[1] },
		host: new URL(canonical.getAttribute('href'), location.origin).host,
		monoUrl,
		sans: styles.getPropertyValue('--font-sans').trim() || getComputedStyle(document.body).fontFamily,
		tokens: {
			canvas: token('--lo-canvas'),
			ink: token('--lo-ink'),
			inkMuted: token('--lo-ink-muted'),
			inkDim: token('--lo-ink-dim'),
			borderControl: token('--lo-border-control'),
			accent: token('--lo-accent'),
			accentActive: token('--lo-accent-active'),
			accentWash: token('--lo-accent-wash'),
		},
	};
})()`;

const pages = [];
for (const route of routes) {
	await reader.navigate(`${origin}${route.pathname}`);
	await settle(reader.evaluate);
	const read = await reader.evaluate(READ_PAGE);
	if (read.missing) {
		fail(
			`${route.pathname} no longer exposes ${read.missing.join(", ")}.\n` +
				"This script reads the live page on purpose, so a renamed hook or template is a loud failure here rather than a silently stale share card. Fix the selector.",
		);
	}
	if (!read.monoUrl) {
		fail(
			`${route.pathname}: no GeistMono @font-face URL found in the page's stylesheets.\n` +
				"The cards set their machine voice in the site's own mono file. If next/font renamed its family, fix the matcher rather than dropping the font.",
		);
	}
	for (const [name, value] of Object.entries(read.tokens)) {
		if (!value)
			fail(
				`${route.pathname}: token --lo-${name === "borderControl" ? "border-control" : name} resolved empty.`,
			);
	}
	read.pathname = route.pathname;
	read.slug = slugFor(route.pathname);
	pages.push(read);
	console.log(`read:    ${route.pathname}`);
}

// ---------------------------------------------------------------------------
// Compose and capture one card per page.
// ---------------------------------------------------------------------------

const escapeHtml = (value) =>
	value.replace(
		/[&<>"']/g,
		(char) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[char],
	);

/**
 * The card document.
 *
 * The layout is the marketing card's structure at the docs site's own
 * proportions: brand lockup on the top edge, the copy block centred in the
 * slack, the footer row on the bottom edge, a 64px gutter and the same 8px
 * rhythm. What it does NOT carry is the marketing card's figure half — there
 * is no one screenshot that depicts a documentation page, and a card is not
 * the place to invent one. The title IS the picture.
 */
const cardHtml = (page) => {
	const t = page.tokens;
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: "Card Mono";
    src: url("${page.monoUrl}") format("woff2");
    font-weight: 100 900;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html, body {
    width: ${CARD.width}px;
    height: ${CARD.height}px;
    overflow: hidden;
    background: ${t.canvas};
    /* Greyscale AA, not subpixel: the card is composited over unknown
       backgrounds in a feed, and RGB fringes baked into a PNG follow it
       everywhere. */
    -webkit-font-smoothing: antialiased;
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    width: ${CARD.width}px;
    height: ${CARD.height}px;
    padding: 56px 64px;
  }

  /* The trim edge: the card's only boundary against a white feed, so it is
     --lo-border-control, the structural weight, not a decorative hairline. */
  .card::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    border: 1px solid ${t.borderControl};
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12.5px;
    color: ${t.ink};
  }
  .brand svg { width: 30px; height: 30px; }
  .brand span {
    font-family: ${page.sans};
    font-size: 25px;
    line-height: 30px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .brand .suffix { color: ${t.inkDim}; }

  .copy {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
  }

  .chip {
    align-self: flex-start;
    border-radius: 2px;
    /* The pill's fill (accent-wash) is 1.019:1 against the canvas, so with no
       edge the tag had no legible boundary; --lo-accent against the wash is
       4.78:1 (design round 1, D1). */
    border: 1px solid ${t.accent};
    background: ${t.accentWash};
    padding: 8px 12px;
    font-family: "Card Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 15px;
    line-height: 1;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${t.accentActive};
  }

  h1 {
    font-family: ${page.sans};
    /* Card scale, not --text-display: the card is shown anywhere from 1200px
       down to a 320px thumbnail, and the title is the whole hook. Wraps to
       two lines at this size for the longest title in the tree. */
    font-size: 56px;
    line-height: 1.06;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: ${t.ink};
    max-width: 1000px;
  }

  .description {
    font-family: ${page.sans};
    font-size: 20px;
    line-height: 1.5;
    font-weight: 400;
    color: ${t.inkMuted};
    max-width: 900px;
  }

  .footer {
    font-family: "Card Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 17px;
    line-height: 1;
    color: ${t.inkDim};
  }
</style>
</head>
<body>
  <div class="card">
    <div class="brand">
      ${page.brand.svg}
      <span>${escapeHtml(page.brand.name)}</span>
      <span class="suffix">${escapeHtml(page.brand.suffix)}</span>
    </div>
    <div class="copy">
      ${page.chip ? `<span class="chip">${escapeHtml(page.chip)}</span>` : ""}
      <h1>${escapeHtml(page.title)}</h1>
      <p class="description">${escapeHtml(page.description)}</p>
    </div>
    <div class="footer">${escapeHtml(page.host)}</div>
  </div>
</body>
</html>`;
};

const cardPage = await openPage(browser);
await browser.send(
	"Emulation.setDeviceMetricsOverride",
	{ ...CARD, deviceScaleFactor: SCALE, mobile: false },
	cardPage.sessionId,
);
// `setDocumentContent` on a page that already holds an origin document: the
// frame keeps that origin, so the font URL resolves and nothing is written
// anywhere for a later `next start` to serve.
await cardPage.navigate(`${origin}/404`);
const { frameTree } = await browser.send(
	"Page.getFrameTree",
	{},
	cardPage.sessionId,
);

/** CRC-32 over raw bytes, for the PNG chunk surgery below. */
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	return c >>> 0;
});
const crc32 = (buffer) => {
	let c = 0xffffffff;
	for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
	const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
	const out = Buffer.alloc(body.length + 8);
	out.writeUInt32BE(data.length, 0);
	body.copy(out, 4);
	out.writeUInt32BE(crc32(body), body.length + 4);
	return out;
};

/**
 * Tag the card sRGB and drop ffmpeg's junk `pHYs`.
 *
 * An untagged PNG is assumed sRGB by every current client, so this is for the
 * older ones that read gamma/chromaticity instead; `pHYs` goes because ffmpeg
 * writes `0 x 1 pixels per unit`, which is not a resolution. Chunk surgery
 * rather than a library: the PNG container is length, type, data, CRC32.
 */
const tagSrgb = (png) => {
	const out = [png.subarray(0, 8)];
	let offset = 8;
	while (offset < png.length) {
		const length = png.readUInt32BE(offset);
		const type = png.toString("latin1", offset + 4, offset + 8);
		const whole = png.subarray(offset, offset + 12 + length);
		offset += 12 + length;
		if (type === "pHYs" || type === "sRGB" || type === "gAMA") continue;
		out.push(whole);
		if (type === "IHDR") {
			out.push(chunk("sRGB", Buffer.from([0])));
			const gama = Buffer.alloc(4);
			gama.writeUInt32BE(45455, 0);
			out.push(chunk("gAMA", gama));
		}
	}
	return Buffer.concat(out);
};

mkdirSync(PUBLIC_OG, { recursive: true });
mkdirSync(join(ROOT, "src", "data"), { recursive: true });
work = mkdtempSync(join(tmpdir(), "lo-og-"));

const cards = {};
for (const page of pages) {
	/**
	 * The card's identity, computed before anything is rendered: the strings
	 * the card will show, the host it will print, the palette it will paint
	 * with, plus the template version. The filename and the drift fingerprint
	 * are two slices of one hash, so they can never disagree about what this
	 * card was made of.
	 *
	 * The palette and the host are in the hash on purpose (review round 1,
	 * minor 1): a token move or a domain move re-addresses every card instead
	 * of shipping stale ones under a gate that never fired.
	 * `check-design-system.mjs` recomputes this exact list — same names, same
	 * order — from `palettes.css` and the built canonical link; keep the two
	 * lists identical or the check will (correctly) fail on every run.
	 */
	const palette = [
		["--lo-canvas", page.tokens.canvas],
		["--lo-ink", page.tokens.ink],
		["--lo-ink-muted", page.tokens.inkMuted],
		["--lo-ink-dim", page.tokens.inkDim],
		["--lo-border-control", page.tokens.borderControl],
		["--lo-accent", page.tokens.accent],
		["--lo-accent-active", page.tokens.accentActive],
		["--lo-accent-wash", page.tokens.accentWash],
	]
		.map(([name, value]) => `${name}=${value}`)
		.join("\n");
	const source = createHash("sha256")
		.update(
			[
				page.title,
				page.description,
				page.chip,
				page.brand.name,
				page.brand.suffix,
				page.host,
				palette,
				String(CARD_TEMPLATE_VERSION),
			].join("\n"),
		)
		.digest("hex");
	const filename = `${page.slug}.${source.slice(0, 8)}.png`;

	// Titles may already end in terminal punctuation ("Run agents where your
	// work lives.", "What is Local Operator?"): the separator adapts rather
	// than stacking a second mark ("lives.. Guides…" — design D2 / review
	// NIT 1).
	const alt = `Local Operator Docs. ${page.title}${
		/[.!?]$/.test(page.title) ? "" : "."
	} ${page.description}`;

	cards[page.pathname] = {
		file: `/og/${filename}`,
		alt,
		source: source.slice(0, 12),
	};

	if (!FORCE && existsSync(join(PUBLIC_OG, filename))) {
		console.log(`kept:    public/og/${filename}`);
		continue;
	}

	await browser.send(
		"Page.setDocumentContent",
		{ frameId: frameTree.frame.id, html: cardHtml(page) },
		cardPage.sessionId,
	);
	await settle(cardPage.evaluate);

	// A title that outgrows two lines collides with the description, and the
	// longest title in the tree sits at two. Warn rather than fail: the title
	// is the page's own H1, so the fix is a copy decision, not a code one.
	const shape = await cardPage.evaluate(`(() => {
		const h1 = document.querySelector('h1');
		const desc = document.querySelector('.description');
		const lines = Math.round(h1.getBoundingClientRect().height / (56 * 1.06));
		return { lines, title: h1.textContent, descLines: Math.round(desc.getBoundingClientRect().height / (20 * 1.5)) };
	})()`);
	if (shape.lines > 2) {
		console.warn(
			`warning: "${shape.title}" wrapped to ${shape.lines} lines; the card is laid out for 2.`,
		);
	}
	if (shape.descLines > 3) {
		console.warn(
			`warning: ${page.pathname}'s description wrapped to ${shape.descLines} lines on the card.`,
		);
	}

	const { data: shotPng } = await browser.send(
		"Page.captureScreenshot",
		{
			format: "png",
			captureBeyondViewport: true,
			clip: { x: 0, y: 0, ...CARD, scale: SCALE },
		},
		cardPage.sessionId,
	);

	const raw = join(work, `${page.slug}@2x.png`);
	const resolved = join(work, `${page.slug}.png`);
	writeFileSync(raw, Buffer.from(shotPng, "base64"));

	const ffmpegResult = spawnSync(
		"ffmpeg",
		[
			"-y",
			"-loglevel",
			"error",
			"-i",
			raw,
			"-vf",
			// `area`, not `lanczos`: an exact 2:1 reduction resolves as a box
			// average over each 2x2 quad, where a windowed sinc's negative
			// lobes overshoot into pure white on warm paper.
			`scale=${CARD.width}:${CARD.height}:flags=area`,
			"-compression_level",
			"100",
			"-pred",
			"mixed",
			resolved,
		],
		{ stdio: "inherit" },
	);
	if (ffmpegResult.status !== 0)
		fail(`ffmpeg failed to downsample ${page.slug}.`);

	const bytes = tagSrgb(readFileSync(resolved));
	writeFileSync(join(PUBLIC_OG, filename), bytes);

	console.log(`wrote:   public/og/${filename}`);
}

await browser.close();
browser = null;
// Removes the ffmpeg work dir; the exit hook then has nothing left to do.
teardown();

// ---------------------------------------------------------------------------
// Sweep, then write the module.
// ---------------------------------------------------------------------------

// Not "the set the module names": iterating between two deploys makes the
// module name a local intermediate while unlinking the card every share since
// last deploy points at. Git is the record of what shipped, so anything
// committed stays, and a failed `git` stops the sweep rather than emptying it.
const listing = spawnSync("git", ["ls-files", "public/og"], {
	cwd: ROOT,
	encoding: "utf8",
});
if (listing.status !== 0) {
	fail(
		"could not ask git which cards are committed, so the sweep cannot tell a shipped card from a local intermediate. Refusing to delete anything.",
	);
}
const committed = new Set(
	listing.stdout
		.split("\n")
		.map((line) => line.replace(/^public\/og\//, "").trim())
		.filter(Boolean),
);

const GENERATED_CARD = /^[a-z0-9-]+\.[0-9a-f]{8}\.png$/;
for (const entry of readdirSync(PUBLIC_OG)) {
	if (Object.values(cards).some((card) => card.file === `/og/${entry}`))
		continue;
	if (committed.has(entry)) continue;
	if (GENERATED_CARD.test(entry)) {
		unlinkSync(join(PUBLIC_OG, entry));
		console.log(`removed: public/og/${entry} (never committed)`);
	}
}

const entries = Object.entries(cards)
	.map(
		([pathname, card]) =>
			`\t${JSON.stringify(pathname)}: {\n` +
			`\t\tfile: ${JSON.stringify(card.file)},\n` +
			`\t\talt: ${JSON.stringify(card.alt)},\n` +
			`\t\tsource: ${JSON.stringify(card.source)},\n` +
			`\t},`,
	)
	.join("\n");

const home = cards["/"];
if (!home)
	fail("the sitemap yielded no root card; every fallback points at it.");

const module = `// GENERATED by scripts/generate-og-images.mjs. Do not edit by hand.
//
// Every docs URL's share card, one entry per published page, keyed by the
// page's own path. Each entry carries three facts the build needs and a
// browser produced:
//
//   - \`file\` hashes the card's INPUTS — the page strings it reads plus
//     CARD_TEMPLATE_VERSION — not its PNG bytes. Chrome's rasteriser moves a
//     few ±1 anti-aliasing samples between launches, so a byte hash would
//     rename every card on every regeneration and invalidate every unfurl
//     for no visible change; stable content keeps stable names, which also
//     lets the generator skip a card whose file already exists. Old files
//     stay in public/og/ on purpose; a share posted before a regeneration
//     renders a white box once its image 404s, so the sweep only removes
//     cards git has never seen.
//   - \`alt\` is composed from the live page's own title and description, so it
//     cannot describe a previous version of the page.
//   - \`source\` fingerprints the strings the card was rendered from;
//     \`scripts/check-design-system.mjs\` recomputes it from the built HTML and
//     fails the build when a page has moved and its card has not.
//
// Regenerate with \`pnpm og\` against a running \`pnpm start\`.
export type OgCard = { file: string; alt: string; source: string };

/** The card's intrinsic size — the numbers every og:image tag declares. */
export const OG_CARD_SIZE = { width: 1200, height: 630 };

export const OG_CARDS: Record<string, OgCard> = {
${entries}
};

/** The root page's card, also the fallback for any route without its own. */
export const OG_CARD_DEFAULT: OgCard = OG_CARDS["/"];
`;
writeFileSync(MODULE, module);

console.log(
	`wrote:   src/data/og-cards.ts (${Object.keys(cards).length} cards)`,
);
if (!existsSync(join(PUBLIC_OG, home.file.replace("/og/", "")))) {
	fail("the default card was not written.");
}
