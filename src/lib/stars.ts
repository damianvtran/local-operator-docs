import { SITE } from "./site";
import { type FetchLike, fetchJson, GITHUB_REPOS } from "./versions";

/**
 * The runtime repository's GitHub star count, for the top bar's GitHub link.
 *
 * The operator asked for the count beside the header's GitHub icon so the
 * docs can "show off how many stars we have" and give readers a one-click
 * path to the repo. It follows the version chip's pipeline on purpose, so
 * the two GitHub-derived values in the bar behave alike:
 *
 *   - `scripts/generate-versions.ts` (prebuild) resolves the count AT BUILD
 *     TIME and writes it to `public/versions.json` as `stars`, so the
 *     server-rendered link already carries a number — never blank, never a
 *     placeholder that pops in after hydration;
 *   - `use-star-count.ts` refreshes it in the browser from
 *     `api.github.com/repos/<repo>` (one request per document, sessionStorage
 *     cache), so a deploy built weeks ago still shows a current count.
 *
 * Unlike a version, a star count can go DOWN (people unstar), so the client
 * takes the live value as-is rather than "newest wins". What it never takes is
 * an invalid value: anything that is not a non-negative integer — a
 * rate-limit body, an HTML error page, `null` — is discarded and the value on
 * screen stays. The committed constant `SITE.githubStars` is the last resort.
 *
 * Pure (no `node:` imports, no React), like `versions.ts`, so the build
 * script, the client hook and vitest run it unchanged.
 */

export const FALLBACK_STARS: number = SITE.githubStars;

/** A count is only ever a finite, non-negative integer; everything else is noise. */
export function parseStarCount(value: unknown): number | null {
	return typeof value === "number" && Number.isInteger(value) && value >= 0
		? value
		: null;
}

/** The count a GitHub `/repos/<owner>/<repo>` payload names, validated. */
export function starsFromRepoPayload(payload: unknown): number | null {
	return parseStarCount(
		(payload as { stargazers_count?: unknown } | null)?.stargazers_count,
	);
}

/** The `stars` a `versions.json` payload (or its text) names, validated. */
export function starsFromVersionsPayload(payload: unknown): number | null {
	return parseStarCount((payload as { stars?: unknown } | null)?.stars);
}

/** Parse `versions.json` text for its count; the fallback when absent/invalid. */
export function starsFromFile(text: string | null): number {
	if (!text) return FALLBACK_STARS;
	try {
		return starsFromVersionsPayload(JSON.parse(text)) ?? FALLBACK_STARS;
	} catch {
		return FALLBACK_STARS;
	}
}

/**
 * GitHub's own compact style (`229`, `1.2k`, `12k`, `1.5m`).
 *
 * Hand-rolled rather than `Intl.NumberFormat({ notation: "compact" })`: the
 * server (Node's ICU) and the visitor's browser must produce byte-identical
 * text or React reports a hydration mismatch, and compact notation is
 * locale-dependent ("1,2 k" in fr, "1.2K" in en). One decimal below 10 of a
 * unit, none above — the width a header control can spare — and the decimal is
 * TRUNCATED, never rounded up, so 999 never reads "1k" and 1,999 never reads
 * "2k" (GitHub truncates the same way).
 */
export function formatStarCount(count: number): string {
	if (!Number.isFinite(count) || count < 0) return "0";
	const n = Math.floor(count);
	const units: [number, string][] = [
		[1_000_000, "m"],
		[1_000, "k"],
	];
	for (const [size, suffix] of units) {
		if (n >= size) {
			const scaled = n / size;
			if (scaled >= 10) return `${Math.floor(scaled)}${suffix}`;
			const oneDecimal = Math.floor(scaled * 10) / 10;
			return `${oneDecimal.toFixed(oneDecimal % 1 === 0 ? 0 : 1)}${suffix}`;
		}
	}
	return String(n);
}

/** The accessible name: the full number, so a screen reader never says "1.2k". */
export function starsLabel(count: number): string {
	const n = Math.floor(count);
	return `Local Operator on GitHub, ${n.toLocaleString("en-US")} ${n === 1 ? "star" : "stars"}`;
}

const REQUEST_TIMEOUT_MS = 5_000;

/** The live count from GitHub, or null on any failure (offline, 403 rate limit, bad body). */
export async function starsFromGitHub(
	fetchImpl: FetchLike,
	repo: string = GITHUB_REPOS.backend,
	timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<number | null> {
	const payload = await fetchJson(
		fetchImpl,
		`https://api.github.com/repos/${repo}`,
		{ Accept: "application/vnd.github+json" },
		timeoutMs,
	);
	return starsFromRepoPayload(payload);
}

/**
 * Build-time resolution: GitHub → the committed constant. Never throws; a
 * fallback is announced through `warn`, never a failed build (the same
 * contract as `resolveVersions`).
 */
export async function resolveStars(options: {
	fetchImpl: FetchLike;
	warn?: (message: string) => void;
}): Promise<number> {
	const live = await starsFromGitHub(options.fetchImpl);
	if (live !== null) return live;
	options.warn?.(
		`GitHub failed for ${GITHUB_REPOS.backend} stars; using the committed fallback ${FALLBACK_STARS}.`,
	);
	return FALLBACK_STARS;
}
