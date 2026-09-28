import { SITE } from "./site";

/**
 * Version resolution for the top-bar chip and the footer note.
 *
 * The docs site does not own a version. It displays the latest release of the
 * runtime (the backend) and of the desktop app, and neither may need a person
 * to remember it — the chip went stale until someone bumped it by hand, which
 * is the report this module answers: "make sure that any versions are properly
 * pulling from the latest".
 *
 * Two readers share this module so they cannot disagree about the order:
 *
 *   - `scripts/generate-versions.ts` (a prebuild step) resolves both versions
 *     AT BUILD TIME and writes `public/versions.json`, so the server-rendered
 *     chip already carries the freshest value known when the site was built;
 *   - `src/lib/use-version-refresh.ts` re-reads that file — and GitHub
 *     directly — in the browser, so a chip deployed days ago still moves to a
 *     release published since.
 *
 * The order, for each version: GitHub Releases (`/releases/latest`; drafts
 * and prereleases are excluded server-side) → PyPI (`info.version` — the
 * backend package's own publish; the desktop app is not on PyPI, so its
 * chain ends one step earlier) → the committed constant in `site.ts`.
 *
 * Every path is best-effort by contract: a source that fails never throws,
 * never renders an error string, and only ever falls back. GitHub's
 * unauthenticated limit is 60 requests an hour per IP, so a rate-limited
 * office NAT is an ordinary case here, not an incident.
 *
 * This module is pure on purpose — no `node:` imports, no React — so the
 * build script, the client hook and vitest all run it unchanged.
 */

export type Versions = {
	backend: string;
	/** The desktop app's release; listed for the download surfaces. */
	ui: string;
	generatedAt: string;
};

export const GITHUB_REPOS = {
	backend: "damianvtran/local-operator",
	ui: "damianvtran/local-operator-ui",
} as const;

export const PYPI_PACKAGE = "local-operator";

/** The last-known values; every failure path lands here. */
export const FALLBACK_VERSIONS = {
	backend: SITE.productVersion,
	ui: SITE.uiVersion,
} as const;

/**
 * The slice of `fetch` these helpers use.
 *
 * Injectable so tests (and only tests) can answer without a network, and
 * deliberately narrower than `RequestInit`/`Response`: what is exercised is
 * this module's parsing and fallback logic, not the platform.
 */
export type FetchLike = (
	url: string,
	init?: { headers?: Record<string, string>; signal?: AbortSignal },
) => Promise<{
	ok: boolean;
	status: number;
	json: () => Promise<unknown>;
}>;

/** `v0.64.1` and `0.64.1` name the same release; the site prints bare. */
export function stripVersionPrefix(raw: string): string {
	const trimmed = raw.trim();
	return trimmed.startsWith("v") || trimmed.startsWith("V")
		? trimmed.slice(1)
		: trimmed;
}

/**
 * Parse `x.y.z`, tolerating a leading `v` and a suffix (`-beta.1`).
 *
 * Returns `null` for anything that is not a semantic version — that is the
 * guard that keeps a rate-limit error page, an HTML 404 or a malformed tag
 * from being rendered as a version.
 */
export function parseSemver(
	raw: string | null | undefined,
): [number, number, number] | null {
	if (typeof raw !== "string") return null;
	const match = /^[vV]?(\d+)\.(\d+)\.(\d+)/.exec(raw.trim());
	if (!match) return null;
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * `-1 | 0 | 1` for two version strings.
 *
 * A value that does not parse orders BEFORE anything that does, so the
 * fallback constant never outranks a real release in a `newestOf` fold.
 */
export function compareSemver(a: string, b: string): number {
	const parsedA = parseSemver(a);
	const parsedB = parseSemver(b);
	if (!parsedA && !parsedB) return 0;
	if (!parsedA) return -1;
	if (!parsedB) return 1;
	for (let i = 0; i < 3; i++) {
		if (parsedA[i] !== parsedB[i]) return parsedA[i] < parsedB[i] ? -1 : 1;
	}
	return 0;
}

/**
 * The newest parseable candidate, or `null` when none parse.
 *
 * On equal values the FIRST candidate wins, which is what makes
 * `newestOf(current, candidate)` a no-op when nothing newer arrived — the
 * "only ever replaces with a newer semver" rule, in one fold.
 */
export function newestOf(
	...candidates: (string | null | undefined)[]
): string | null {
	let best: string | null = null;
	for (const candidate of candidates) {
		if (!candidate || !parseSemver(candidate)) continue;
		if (best === null || compareSemver(candidate, best) > 0) best = candidate;
	}
	return best;
}

/** The tag a GitHub `/releases/latest` payload names, validated. */
export function tagFromReleasePayload(payload: unknown): string | null {
	const tag = (payload as { tag_name?: unknown } | null)?.tag_name;
	return typeof tag === "string" && parseSemver(tag)
		? stripVersionPrefix(tag)
		: null;
}

/** The `backend` a `versions.json` payload names, validated. */
export function backendFromVersionsPayload(payload: unknown): string | null {
	const value = (payload as { backend?: unknown } | null)?.backend;
	return typeof value === "string" && parseSemver(value)
		? stripVersionPrefix(value)
		: null;
}

/**
 * Validate a `versions.json` text. Field by field, so a file with one bad
 * field still contributes the other; `null` when the text is not an object
 * at all.
 */
export function parseVersionsFile(text: string): Partial<Versions> | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		return null;
	}
	if (!parsed || typeof parsed !== "object") return null;
	const source = parsed as Record<string, unknown>;
	const out: Partial<Versions> = {};
	if (typeof source.backend === "string" && parseSemver(source.backend)) {
		out.backend = stripVersionPrefix(source.backend);
	}
	if (typeof source.ui === "string" && parseSemver(source.ui)) {
		out.ui = stripVersionPrefix(source.ui);
	}
	if (typeof source.generatedAt === "string")
		out.generatedAt = source.generatedAt;
	return out;
}

/** The file's values over the fallbacks — the merge both readers share. */
export function versionsFromFile(text: string | null): Versions {
	const parsed = text ? parseVersionsFile(text) : null;
	return {
		backend: parsed?.backend ?? FALLBACK_VERSIONS.backend,
		ui: parsed?.ui ?? FALLBACK_VERSIONS.ui,
		generatedAt: parsed?.generatedAt ?? "",
	};
}

/** One request, JSON or nothing. The timeout keeps a hung socket off a build. */
async function fetchJson(
	fetchImpl: FetchLike,
	url: string,
	headers: Record<string, string>,
	timeoutMs: number,
): Promise<unknown | null> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetchImpl(url, {
			headers,
			signal: controller.signal,
		});
		if (!response.ok) return null;
		return await response.json();
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

const REQUEST_TIMEOUT_MS = 5_000;

export async function latestFromGitHub(
	repo: string,
	fetchImpl: FetchLike,
): Promise<string | null> {
	const payload = await fetchJson(
		fetchImpl,
		`https://api.github.com/repos/${repo}/releases/latest`,
		{
			Accept: "application/vnd.github+json",
			"User-Agent": "local-operator-docs",
		},
		REQUEST_TIMEOUT_MS,
	);
	return tagFromReleasePayload(payload);
}

export async function latestFromPyPI(
	fetchImpl: FetchLike,
): Promise<string | null> {
	const payload = await fetchJson(
		fetchImpl,
		`https://pypi.org/pypi/${PYPI_PACKAGE}/json`,
		{ "User-Agent": "local-operator-docs" },
		REQUEST_TIMEOUT_MS,
	);
	const version = (payload as { info?: { version?: unknown } } | null)?.info
		?.version;
	return typeof version === "string" && parseSemver(version)
		? stripVersionPrefix(version)
		: null;
}

/**
 * Resolve both versions. Never throws; never returns an empty value.
 *
 * The backend walks the full chain (GitHub → PyPI → constant); the desktop
 * app walks GitHub → constant, because it is not published to PyPI. Each
 * downgrade to the fallback is announced through `warn` — the script routes
 * it to `console.warn` and the build carries on, which is the contract the
 * operator asked for ("NEVER fail the build on a fetch failure").
 */
export async function resolveVersions(options: {
	fetchImpl: FetchLike;
	now?: Date;
	warn?: (message: string) => void;
}): Promise<Versions> {
	const { fetchImpl, now = new Date(), warn } = options;
	const note = (message: string) => warn?.(message);

	let backend = await latestFromGitHub(GITHUB_REPOS.backend, fetchImpl);
	if (!backend) {
		backend = await latestFromPyPI(fetchImpl);
		if (!backend) {
			note(
				`GitHub and PyPI both failed for ${GITHUB_REPOS.backend}; using the committed fallback v${FALLBACK_VERSIONS.backend}.`,
			);
		}
	}
	let ui = await latestFromGitHub(GITHUB_REPOS.ui, fetchImpl);
	if (!ui) {
		note(
			`GitHub failed for ${GITHUB_REPOS.ui}; using the committed fallback v${FALLBACK_VERSIONS.ui}.`,
		);
		ui = FALLBACK_VERSIONS.ui;
	}

	return {
		backend: backend ?? FALLBACK_VERSIONS.backend,
		ui,
		generatedAt: now.toISOString(),
	};
}
