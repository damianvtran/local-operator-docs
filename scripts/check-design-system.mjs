// @ts-check
/**
 * The design-system guard: small, honest, and wired into `pnpm lint` and the
 * build (`prebuild`). Three rules, each one a thing a reviewer would
 * otherwise have to catch by eye:
 *
 *   1. No hex colours outside the two token files (the palette values and the
 *      syntax themes). Components read roles; if a value shows up in a
 *      component it is a second source of truth for brand colour.
 *   2. No `outline: none` / `outline-*: 0` anywhere — focus indication is not
 *      removable, and the sight of the rule is the bug (we use outline-based
 *      focus rings precisely so they survive stacking contexts).
 *   3. No raw Tailwind palette colours or arbitrary hex utilities in
 *      components (`bg-blue-500`, `text-[#fff]`): the palette is the role
 *      vocabulary, and Tailwind's stock ramp is not in it.
 *
 * Rules 1 and 3 overlap on purpose: one catches rewritten CSS, the other
 * catches utility classes that never pass through a stylesheet.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { CARD_TEMPLATE_VERSION } from "./lib/og-card-template.mjs";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

/** Files allowed to contain raw colour values, and WHY. */
const HEX_ALLOWED = new Set([
	"src/styles/palettes.css", // the theme values themselves
	"src/lib/shiki-theme.ts", // syntax-highlighting theme, mapped from the palette
]);

const PALETTE_NAMES =
	"slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white";

const PALETTE_UTILITY = new RegExp(
	`(?:^|[\\s"'\`(])(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|shadow)-(?:${PALETTE_NAMES})(?:-\\d{1,3})?(?![\\w-])`,
	"g",
);
const ARBITRARY_HEX = /-\[#[0-9a-fA-F]{3,8}\]/g;
const HEX =
	/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g;
const OUTLINE_NONE =
	/outline(?:-(?:style|width))?\s*:\s*(?:none|0)\b|outline-(?:none|hidden|0)(?![\\w-])/g;

/** @param {string} dir @returns {string[]} */
function walk(dir) {
	/** @type {string[]} */
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules" || entry.name === ".next") continue;
			out.push(...walk(full));
		} else if (/\.(ts|tsx|css|mjs|js)$/.test(entry.name)) {
			out.push(full);
		}
	}
	return out;
}

/** @type {string[]} */
const problems = [];
let checked = 0;

for (const file of walk(SRC)) {
	const rel = path.relative(ROOT, file).split(path.sep).join("/");
	const text = readFileSync(file, "utf8");
	const lines = text.split("\n");
	checked += 1;

	lines.forEach((line, index) => {
		const at = `${rel}:${index + 1}`;

		if (!HEX_ALLOWED.has(rel)) {
			for (const match of line.matchAll(HEX)) {
				problems.push(
					`${at}: hex colour ${match[0]} — read a role token instead`,
				);
			}
			for (const match of line.matchAll(ARBITRARY_HEX)) {
				problems.push(
					`${at}: arbitrary colour utility ${match[0]} — read a role token instead`,
				);
			}
		}

		// Rule 2 everywhere, including token files: nothing may remove outlines.
		for (const match of line.matchAll(OUTLINE_NONE)) {
			problems.push(`${at}: ${match[0]} — focus indication is not removable`);
		}

		// Rule 3: utility classes in components/app code.
		if (rel.startsWith("src/components/") || rel.startsWith("src/app/")) {
			for (const match of line.matchAll(PALETTE_UTILITY)) {
				problems.push(
					`${at}: raw palette utility "${match[0].trim()}" — use a role (bg-surface, text-ink-muted, ...)`,
				);
			}
		}
	});
}

// -- og-cards-in-sync --------------------------------------------------------
// The share cards are PNGs of the pages, generated offline by
// `scripts/generate-og-images.mjs` and committed. Nothing in the build renders
// them, so nothing in the build would notice when a page moves on and its card
// does not — and a card that answers `200 image/png` while depicting an older
// page passes every check that asks "is there a card" rather than "is it a
// card of THIS page". This rule asks the second question.
//
// The generator records, per page, a fingerprint of the strings the card was
// rendered from (title, description, section chip, brand lockup, template
// version). This recomputes that fingerprint from the prerendered HTML the
// build just wrote, so a renamed page, reworded description or moved section
// fails the build until `pnpm og` re-renders the card.
//
// The two halves fail differently on purpose, the same trade the marketing
// site's `og-card-in-sync` documents:
//
//   - The file-exists half needs no build. A missing card is a hard failure:
//     every unfurl of that page would have no image.
//   - The fingerprint and coverage halves need `.next/`, so they are skipped
//     (with a note) on a lint run before any build. That skip is why
//     `package.json` runs this script again as `postbuild`: `.next` is
//     guaranteed fresh at exactly that point, so the drift gate always
//     actually runs on the path that ships.
{
	const ogProblems = [];
	const ogModule = path.join(SRC, "data", "og-cards.ts");
	const ogDir = path.join(ROOT, "public", "og");
	const builtApp = path.join(ROOT, ".next", "server", "app");

	// Entry shape is written by the generator: one keyed object per page with
	// `file` / `alt` / `source`. `alt` may contain escaped quotes, hence the
	// escape-aware alternative in the pattern.
	const ENTRY =
		/"([^"]+)":\s*\{\s*file:\s*"([^"]+)",\s*alt:\s*"((?:[^"\\]|\\.)*)",\s*source:\s*"([0-9a-f]+)",?\s*\}/g;
	const entries = existsSync(ogModule)
		? [...readFileSync(ogModule, "utf8").matchAll(ENTRY)].map((match) => ({
				path: match[1],
				file: match[2],
				source: match[4],
			}))
		: [];

	if (!existsSync(ogModule) || entries.length === 0) {
		ogProblems.push(
			"[og-cards-in-sync] src/data/og-cards.ts is missing or names no cards.\n" +
				"    That file is generated; run `pnpm og` against a running `pnpm start` rather than editing it.",
		);
	}

	for (const entry of entries) {
		const name = entry.file.replace("/og/", "");
		if (!existsSync(path.join(ogDir, name))) {
			ogProblems.push(
				`[og-cards-in-sync] src/data/og-cards.ts names ${entry.file}, which is not in public/og/.\n` +
					"    Every og:image tag for that page points at it, so this ships a card that 404s on every unfurl. Run `pnpm og`.",
			);
		}
	}

	// The fingerprint halves need the built HTML. `index.html` is the marker:
	// if the app router's output is there, so is everything else this reads.
	if (!existsSync(path.join(builtApp, "index.html"))) {
		console.log(
			"check-design-system: og-cards-in-sync files present; fingerprint half skipped (no .next build)",
		);
	} else {
		// Entities decode in the same order the site's check documents: `&amp;`
		// is last, or `&amp;lt;` would decode twice. `textContent` is what the
		// generator reads on the live page, and this is its static equivalent.
		const decode = (value) =>
			value
				.replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
					String.fromCodePoint(Number.parseInt(hex, 16)),
				)
				.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/&amp;/g, "&");

		/** Inner HTML → the text `textContent` would yield. */
		const text = (html) =>
			decode(html.replace(/<[^>]*>/g, " "))
				.replace(/\s+/g, " ")
				.trim();

		/** @type {(html: string) => string | null} */
		const readPage = (html) => {
			const h1 = html.match(/<h1(?=[\s>])[^>]*>([\s\S]*?)<\/h1>/i);
			const meta = html.match(
				/<meta\s+name="description"\s+content="([^"]*)"/i,
			);
			if (!h1 || !meta) return null;

			// The chip: the breadcrumb's group item (five items: Docs / group /
			// title) or, on the root page, the hero eyebrow the generator reads
			// by id. Same contract as the generator, deliberately.
			const eyebrow = html.match(
				/<p(?=[\s>])[^>]*id="home-eyebrow"[^>]*>([\s\S]*?)<\/p>/i,
			);
			let chip = eyebrow ? text(eyebrow[1]) : "";
			if (!eyebrow) {
				const nav = html.match(
					/<nav(?=[\s>])[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/i,
				);
				if (nav) {
					const items = [
						...nav[1].matchAll(/<li(?=[\s>])[^>]*>([\s\S]*?)<\/li>/gi),
					].map((match) => text(match[1]));
					if (items.length === 5) chip = items[2];
				}
			}

			// The brand lockup: the top bar's home link, whose two spans are the
			// name and the product suffix (“Docs”).
			const brand = html.match(
				/<a(?=[\s>])[^>]*aria-label="Local Operator home"[^>]*>([\s\S]*?)<\/a>/i,
			);
			if (!brand) return null;
			const spans = [
				...brand[1].matchAll(/<span(?=[\s>])[^>]*>([\s\S]*?)<\/span>/gi),
			].map((match) => text(match[1]));
			if (spans.length < 2) return null;

			// The canonical link: the card prints its host and the fingerprint
			// covers it, so a domain move must re-address the cards.
			const canonical = html.match(
				/<link(?=[\s>])[^>]*rel="canonical"[^>]*href="([^"]+)"/i,
			);
			if (!canonical) return null;
			let host = "";
			try {
				host = new URL(canonical[1]).host;
			} catch {
				// A relative canonical would fingerprint as "" and fail against
				// the generator's host — which is the desired loud failure.
			}

			return {
				title: text(h1[1]),
				description: decode(meta[1]),
				chip,
				brandName: spans[0],
				brandSuffix: spans[1],
				host,
			};
		};

		/**
		 * The card's palette, read from the file the theme itself reads: the light
		 * block of `palettes.css`. The generator reads the same eight values off
		 * the live page's computed styles; this list must stay identical to the
		 * generator's — same names, same order (review round 1, minor 1: a
		 * palette move must fail this gate, not ship stale cards silently).
		 */
		const PALETTE_TOKENS = [
			"--lo-canvas",
			"--lo-ink",
			"--lo-ink-muted",
			"--lo-ink-dim",
			"--lo-border-control",
			"--lo-accent",
			"--lo-accent-active",
			"--lo-accent-wash",
		];
		const palette = (() => {
			const css = readFileSync(
				path.join(SRC, "styles", "palettes.css"),
				"utf8",
			);
			// Anchored at line start: the file's header comment also names
			// `localOperatorLight`, and splitting on the bare string picked the
			// dark block up from after the comment.
			const match = css.match(
				/^\[data-theme="localOperatorLight"\]\s*\{([\s\S]*?)\}/m,
			);
			const scope = match ? match[1] : "";
			return PALETTE_TOKENS.map((name) => {
				const token = scope.match(new RegExp(`${name}:\\s*([^;]+);`));
				return `${name}=${token ? token[1].trim() : ""}`;
			}).join("\n");
		})();

		const fingerprint = (page) =>
			createHash("sha256")
				.update(
					[
						page.title,
						page.description,
						page.chip,
						page.brandName,
						page.brandSuffix,
						page.host,
						palette,
						String(CARD_TEMPLATE_VERSION),
					].join("\n"),
				)
				.digest("hex")
				.slice(0, 12);

		// Coverage: every page the build published (its own sitemap) must have
		// a card. Extra module entries without a published page are equally
		// wrong — they are cards of nothing.
		const sitemapBody = path.join(builtApp, "sitemap.xml.body");
		if (!existsSync(sitemapBody)) {
			ogProblems.push(
				"[og-cards-in-sync] .next has no sitemap.xml.body, so card coverage cannot be checked.\n" +
					"    The sitemap is what tells the generator which pages exist; without it `pnpm og` would generate nothing.",
			);
		} else {
			const published = new Set(
				[
					...readFileSync(sitemapBody, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g),
				].map((match) => new URL(match[1]).pathname.replace(/\/$/, "") || "/"),
			);
			const covered = new Set(entries.map((entry) => entry.path));
			for (const route of published) {
				if (!covered.has(route)) {
					ogProblems.push(
						`[og-cards-in-sync] ${route} is published but has no card in src/data/og-cards.ts. Run \`pnpm og\`.`,
					);
				}
			}
			for (const route of covered) {
				if (!published.has(route)) {
					ogProblems.push(
						`[og-cards-in-sync] ${route} has a card but is not a published page (draft, or renamed). Run \`pnpm og\` to drop it.`,
					);
				}
			}
		}

		for (const entry of entries) {
			const file = entry.path === "/" ? "index.html" : `${entry.path}.html`;
			const htmlPath = path.join(builtApp, file);
			if (!existsSync(htmlPath)) {
				ogProblems.push(
					`[og-cards-in-sync] no built HTML at .next/server/app/${file} for ${entry.path}, so its card cannot be verified.`,
				);
				continue;
			}
			const page = readPage(readFileSync(htmlPath, "utf8"));
			if (!page) {
				ogProblems.push(
					`[og-cards-in-sync] could not read the title, description, chip, brand lockup or canonical link out of ${file}.\n` +
						"    The generator reads the same hooks off the live page, so it is about to fail as well. Fix the selectors in both places.",
				);
				continue;
			}
			const actual = fingerprint(page);
			if (actual !== entry.source) {
				ogProblems.push(
					`[og-cards-in-sync] ${entry.path} has moved since its card was rendered.\n` +
						`    card: "${entry.source}", page now: "${actual}" — title "${page.title}", description "${page.description.slice(0, 60)}…", chip "${page.chip}".\n` +
						"    Run `pnpm og` against a running `pnpm start` and commit the new card.",
				);
			}
		}

		if (ogProblems.length === 0) {
			console.log(
				`check-design-system: og-cards-in-sync ${entries.length} cards, fingerprints match the built pages`,
			);
		}
	}

	problems.push(...ogProblems);
}

if (problems.length > 0) {
	console.error(`check-design-system: ${problems.length} problem(s)\n`);
	for (const problem of problems) console.error(`  - ${problem}`);
	process.exit(1);
}

console.log(`check-design-system: ${checked} files, all rules pass`);
