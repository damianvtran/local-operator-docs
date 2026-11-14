"use client";

import { useEffect, useState } from "react";
import { parseStarCount, starsFromGitHub } from "./stars";

/**
 * The client half of the star count: after hydration, replace the build-time
 * value with GitHub's current one.
 *
 * The same cost rules as `use-version-refresh.ts`, so the bar's two
 * GitHub-derived values cannot drift about what a lookup may do:
 *
 *   - ONE request per document — a module-level in-flight promise;
 *   - a `sessionStorage` cache (versioned key + shape check + TTL), so a
 *     client-side navigation or a reload in the same tab makes no request;
 *   - a hard timeout; a hung socket abandons the fetch;
 *   - NO user-visible failure state: GitHub's unauthenticated limit is 60
 *     requests/hour per IP, so a 403 is an ordinary case — the value baked
 *     into the HTML simply stays.
 *
 * Shorter TTL than versions (1h vs 6h): stars move more often than releases
 * and the request is cheap, yet a reader paging through the docs in one
 * sitting still costs at most one request.
 *
 * Only a valid count replaces the one on screen (`parseStarCount`); unlike
 * versions it may be LOWER — an unstar is real data, not a regression.
 *
 * CSP: this site sends no Content-Security-Policy (next.config.ts sets no
 * headers), and the version hook already calls api.github.com from the
 * browser, so no policy changes with this.
 */

const CACHE_KEY = "lo-docs-stars-v1";
const CACHE_TTL_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 4000;

type CacheEnvelope = { stars: number; fetchedAt: number };

const readCache = (): number | null => {
	try {
		const raw = sessionStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<CacheEnvelope>;
		if (
			typeof parsed.fetchedAt !== "number" ||
			Date.now() - parsed.fetchedAt > CACHE_TTL_MS
		) {
			return null;
		}
		return parseStarCount(parsed.stars);
	} catch {
		// sessionStorage unavailable (privacy mode): no cache.
		return null;
	}
};

const writeCache = (stars: number): void => {
	try {
		sessionStorage.setItem(
			CACHE_KEY,
			JSON.stringify({ stars, fetchedAt: Date.now() } satisfies CacheEnvelope),
		);
	} catch {
		// See readCache.
	}
};

const fetchStars = async (): Promise<number | null> => {
	const stars = await starsFromGitHub(fetch, undefined, TIMEOUT_MS);
	if (stars === null) {
		console.warn(
			"local-operator-docs: GitHub star lookup failed; keeping the build-time count.",
		);
		return null;
	}
	writeCache(stars);
	return stars;
};

/**
 * Reset after a failure so a reader who regains connectivity gets another
 * chance on the next mount instead of a poisoned result.
 */
let inFlight: Promise<number | null> | null = null;

export function useStarCount(initial: number): number {
	const [stars, setStars] = useState(initial);

	useEffect(() => {
		let live = true;
		const apply = (remote: number | null) => {
			if (live && remote !== null) setStars(remote);
		};

		const cached = readCache();
		if (cached !== null) {
			apply(cached);
			return () => {
				live = false;
			};
		}

		if (!inFlight) inFlight = fetchStars();
		inFlight.then((remote) => {
			if (remote === null) inFlight = null;
			apply(remote);
		});

		return () => {
			live = false;
		};
	}, []);

	return stars;
}
