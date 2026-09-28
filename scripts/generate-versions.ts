import fs from "node:fs";
import path from "node:path";
import { resolveVersions } from "../src/lib/versions";

/**
 * Writes `public/versions.json` for the top-bar chip and the footer note.
 *
 * Sources, in order, per version: GitHub Releases (`/releases/latest`) for
 * `damianvtran/local-operator` (the runtime the chip names) and
 * `damianvtran/local-operator-ui` (the desktop app, for the download
 * surfaces) → PyPI for the backend's own publish → the committed constants in
 * `src/lib/site.ts`. The backend has one more chain link than the app because
 * a PyPI publish exists for it and not for the app.
 *
 * Runs as a prebuild step, the same shape as `generate-search-index.ts`: the
 * site never ships a value a person typed, and the operator's report — a chip
 * that went stale until someone bumped it by hand — cannot recur.
 *
 * A fetch failure is NEVER a build failure: every source is best-effort, the
 * fallback is written instead, and the run says which source it used. CI and
 * Railway have the network; a reader building offline gets the constants,
 * which is exactly what the site printed before this file existed.
 *
 * Note on this machine: a tool child that inherits `XPC_FLAGS` cannot resolve
 * DNS (see the docs repo's AGENTS.md, "Environment"). If both sources fail
 * with a resolver error, run the build as `env -u XPC_FLAGS pnpm build` —
 * the warning below is the only symptom.
 */
const OUT = path.join(process.cwd(), "public", "versions.json");

async function main(): Promise<void> {
	const versions = await resolveVersions({
		fetchImpl: fetch,
		warn: (message) => console.warn(`[versions] ${message}`),
	});

	fs.mkdirSync(path.dirname(OUT), { recursive: true });
	fs.writeFileSync(OUT, `${JSON.stringify(versions, null, "\t")}\n`);
	console.log(
		`versions: backend v${versions.backend}, ui v${versions.ui} -> public/versions.json`,
	);
}

main().catch((error) => {
	// Unreachable by construction (`resolveVersions` catches everything), kept
	// so a future edit cannot turn a version lookup into a failed build. The
	// read side (`src/lib/built-versions.ts`) treats a missing file as the
	// committed fallbacks, so exiting here is safe.
	console.warn(
		`[versions] unexpected failure, leaving fallbacks in place: ${error}`,
	);
});
