"use client";

import { useEffect, useState } from "react";
import {
	backendFromVersionsPayload,
	GITHUB_REPOS,
	latestFromGitHub,
	newestOf,
} from "./versions";

/**
 * The client half of the version story: after hydration, move the chip to a
 * value newer than the one this deploy was built with.
 *
 * Modelled on the marketing site's `use-latest-release.ts`, deliberately, so
 * the two properties cannot drift about what a version fetch may cost or do:
 *
 *   - ONE request per document — a module-level in-flight promise collapses
 *     every consumer (the chip and the footer note are two) into one;
 *   - a `sessionStorage` cache (versioned key + shape check + 6h TTL), so a
 *     client-side navigation or a repeat visit makes no request at all;
 *   - a hard 4s timeout per request; a hung socket abandons the fetch rather
 *     than pinning a pending promise forever;
 *   - NO user-visible failure state, ever: every failure path is a warning to
 *     the console, and the rendered value only ever moves FORWARD
 *     (`newestOf`), so a rate-limited or offline visitor keeps reading the
 *     build-time value baked into the HTML.
 *
 * Two sources, because they answer different questions. `/versions.json` is
 * what this deploy resolved at build; `api.github.com/.../releases/latest`
 * answers "has a release happened since?" — the freshness case the operator
 * named ("between deploys"). The newer of the two wins; GitHub is
 * unauthenticated, so its 60-an-hour limit is expected to fire sometimes and
 * is not an incident.
 *
 * The GitHub source is asked for the BACKEND repo only: the chip and the
 * footer note name the runtime. The app's own version rides in
 * `/versions.json` for the download surfaces, where a build-time value is
 * enough.
 */

const CACHE_KEY = "lo-docs-versions-v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 4000;

type CacheEnvelope = { backend: string; fetchedAt: number };

const readCache = (): string | null => {
	try {
		const raw = sessionStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<CacheEnvelope>;
		/*
		 * Shape-checked, not trusted: the key is versioned, but a person
		 * editing this file is likelier to change the shape than to remember
		 * the key. `newestOf` below is the second net — a malformed value
		 * simply loses to the one on screen.
		 */
		if (
			typeof parsed.backend !== "string" ||
			typeof parsed.fetchedAt !== "number" ||
			Date.now() - parsed.fetchedAt > CACHE_TTL_MS
		) {
			return null;
		}
		return parsed.backend;
	} catch {
		// sessionStorage unavailable (privacy mode, SSR guard): no cache.
		return null;
	}
};

const writeCache = (backend: string): void => {
	try {
		sessionStorage.setItem(
			CACHE_KEY,
			JSON.stringify({
				backend,
				fetchedAt: Date.now(),
			} satisfies CacheEnvelope),
		);
	} catch {
		// See readCache.
	}
};

/** One JSON GET with its own timeout; null on any failure. */
const fetchJson = async (url: string): Promise<unknown | null> => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const response = await fetch(url, {
			signal: controller.signal,
			headers: { Accept: "application/json" },
		});
		if (!response.ok) {
			console.warn(
				`local-operator-docs: version lookup ${url} returned ${response.status}; keeping the current value.`,
			);
			return null;
		}
		return await response.json();
	} catch {
		// Offline, blocked, timed out — all the same to the reader.
		console.warn(
			`local-operator-docs: version lookup ${url} failed; keeping the current value.`,
		);
		return null;
	} finally {
		clearTimeout(timer);
	}
};

/** The newest backend version the network knows, or null. */
const fetchNewestBackend = async (): Promise<string | null> => {
	const [file, github] = await Promise.all([
		fetchJson("/versions.json").then(backendFromVersionsPayload),
		latestFromGitHub(GITHUB_REPOS.backend, fetch),
	]);
	const best = newestOf(file, github);
	if (best) writeCache(best);
	return best;
};

/**
 * The single in-flight request, shared for the life of the document — the
 * same rule as the marketing site's hook. Reset after a failure so a visitor
 * who regains connectivity and navigates gets a second chance rather than a
 * poisoned result.
 */
let inFlight: Promise<string | null> | null = null;

export function useBackendVersion(initial: string): string {
	const [version, setVersion] = useState(initial);

	useEffect(() => {
		let live = true;
		const apply = (remote: string | null) => {
			if (!live || !remote) return;
			setVersion((current) => newestOf(current, remote) ?? current);
		};

		const cached = readCache();
		if (cached) {
			// The session already knows; no request at all.
			apply(cached);
			return () => {
				live = false;
			};
		}

		if (!inFlight) inFlight = fetchNewestBackend();
		inFlight.then((remote) => {
			if (remote === null) inFlight = null;
			apply(remote);
		});

		return () => {
			live = false;
		};
	}, []);

	return version;
}
