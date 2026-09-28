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
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

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

if (problems.length > 0) {
	console.error(`check-design-system: ${problems.length} problem(s)\n`);
	for (const problem of problems) console.error(`  - ${problem}`);
	process.exit(1);
}

console.log(`check-design-system: ${checked} files, all rules pass`);
