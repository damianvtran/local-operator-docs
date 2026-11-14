import fs from "node:fs";
import path from "node:path";
import { starsFromFile } from "./stars";
import { versionsFromFile } from "./versions";

/**
 * The versions this build resolved, as the server renders them.
 *
 * `scripts/generate-versions.ts` runs in `prebuild` and writes
 * `public/versions.json`; this module reads it back for the first paint, so
 * the chip's static HTML already carries the best value known at build time
 * and the client hook only ever has to move it FORWARD (see
 * `use-version-refresh.ts`). Missing or unreadable file (a dev server started
 * without a build, a fresh checkout): the committed fallbacks, silently —
 * the chip must never be blank or an error.
 *
 * Server-only (reads the filesystem via `process.cwd()`); the client must
 * import the resolved initial value as a prop, never this module.
 */
let cached: ReturnType<typeof versionsFromFile> | null = null;
let cachedStars: number | null = null;

function readVersionsFile(): string | null {
	try {
		return fs.readFileSync(
			path.join(process.cwd(), "public", "versions.json"),
			"utf8",
		);
	} catch {
		return null;
	}
}

export function buildVersions(): ReturnType<typeof versionsFromFile> {
	if (cached) return cached;
	cached = versionsFromFile(readVersionsFile());
	return cached;
}

/**
 * The GitHub star count this build resolved (the `stars` field the same
 * prebuild step writes), or the committed fallback — same first-paint
 * contract as the version chip: the header link is never rendered without a
 * number.
 */
export function buildStars(): number {
	if (cachedStars !== null) return cachedStars;
	cachedStars = starsFromFile(readVersionsFile());
	return cachedStars;
}
