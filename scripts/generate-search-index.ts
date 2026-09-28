import fs from "node:fs";
import path from "node:path";
import { buildSearchIndex } from "../src/lib/search/index-gen";

/**
 * Writes `public/search-index.json` for the client palette.
 *
 * Runs as a predev/prebuild step so the index can never be stale-or-missing
 * in a way that silently answers every query with nothing (the radient-docs
 * failure this build was briefed to avoid). An empty index is a hard error:
 * there is no correct state in which the site ships with no search content.
 */
const OUT = path.join(process.cwd(), "public", "search-index.json");

const index = buildSearchIndex();

if (index.entries.length === 0) {
	console.error(
		"search index is EMPTY — check that content/**/*.md exists and validates",
	);
	process.exit(1);
}

const pages = index.entries.filter((entry) => entry.kind === "page").length;
const sections = index.entries.filter(
	(entry) => entry.kind === "section",
).length;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(index));

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(
	`search index: ${index.entries.length} entries (${pages} pages, ${sections} sections) -> public/search-index.json (${kb} KB)`,
);
