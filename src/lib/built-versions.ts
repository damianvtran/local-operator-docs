import fs from "node:fs";
import path from "node:path";
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

export function buildVersions(): ReturnType<typeof versionsFromFile> {
	if (cached) return cached;
	let text: string | null = null;
	try {
		text = fs.readFileSync(
			path.join(process.cwd(), "public", "versions.json"),
			"utf8",
		);
	} catch {
		text = null;
	}
	cached = versionsFromFile(text);
	return cached;
}
