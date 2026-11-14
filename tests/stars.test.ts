import { describe, expect, it, vi } from "vitest";
import {
	FALLBACK_STARS,
	formatStarCount,
	parseStarCount,
	resolveStars,
	starsFromFile,
	starsFromGitHub,
	starsFromRepoPayload,
	starsLabel,
} from "@/lib/stars";
import type { FetchLike } from "@/lib/versions";

/**
 * The star count's contract: the header link always shows a number (build
 * value or committed fallback), never "NaN"/blank, and a failed or
 * rate-limited GitHub lookup changes nothing.
 */

const okFetch =
	(payload: unknown): FetchLike =>
	async () => ({ ok: true, status: 200, json: async () => payload });

describe("formatStarCount", () => {
	it("prints small counts verbatim", () => {
		expect(formatStarCount(0)).toBe("0");
		expect(formatStarCount(229)).toBe("229");
		expect(formatStarCount(999)).toBe("999");
	});

	it("compacts thousands and millions, truncating rather than rounding up", () => {
		expect(formatStarCount(1000)).toBe("1k");
		expect(formatStarCount(1234)).toBe("1.2k");
		expect(formatStarCount(1999)).toBe("1.9k");
		expect(formatStarCount(9999)).toBe("9.9k");
		expect(formatStarCount(12_345)).toBe("12k");
		expect(formatStarCount(999_999)).toBe("999k");
		expect(formatStarCount(1_500_000)).toBe("1.5m");
	});

	it("never renders NaN or a negative", () => {
		expect(formatStarCount(Number.NaN)).toBe("0");
		expect(formatStarCount(-5)).toBe("0");
	});
});

describe("starsLabel", () => {
	it("names the full count for assistive tech", () => {
		expect(starsLabel(229)).toBe("Local Operator on GitHub, 229 stars");
		expect(starsLabel(1234)).toBe("Local Operator on GitHub, 1,234 stars");
		expect(starsLabel(1)).toBe("Local Operator on GitHub, 1 star");
	});
});

describe("payload guards", () => {
	it("accepts only non-negative integers", () => {
		expect(parseStarCount(229)).toBe(229);
		expect(parseStarCount(0)).toBe(0);
		expect(parseStarCount(-1)).toBeNull();
		expect(parseStarCount(1.5)).toBeNull();
		expect(parseStarCount("229")).toBeNull();
		expect(parseStarCount(Number.NaN)).toBeNull();
		expect(parseStarCount(undefined)).toBeNull();
	});

	it("reads stargazers_count and rejects a rate-limit body", () => {
		expect(starsFromRepoPayload({ stargazers_count: 229 })).toBe(229);
		expect(
			starsFromRepoPayload({ message: "API rate limit exceeded" }),
		).toBeNull();
		expect(starsFromRepoPayload(null)).toBeNull();
	});

	it("falls back to the committed count for a missing or bad versions.json", () => {
		expect(starsFromFile('{"backend":"0.1.0","stars":512}')).toBe(512);
		expect(starsFromFile('{"backend":"0.1.0"}')).toBe(FALLBACK_STARS);
		expect(starsFromFile('{"stars":"lots"}')).toBe(FALLBACK_STARS);
		expect(starsFromFile("not json")).toBe(FALLBACK_STARS);
		expect(starsFromFile(null)).toBe(FALLBACK_STARS);
	});
});

describe("GitHub lookup", () => {
	it("asks the repo endpoint and returns its count", async () => {
		const fetchImpl = vi.fn(okFetch({ stargazers_count: 300 }));
		await expect(starsFromGitHub(fetchImpl)).resolves.toBe(300);
		expect(fetchImpl).toHaveBeenCalledWith(
			"https://api.github.com/repos/damianvtran/local-operator",
			expect.anything(),
		);
	});

	it("returns null on a 403 rate limit or a network error", async () => {
		const rateLimited: FetchLike = async () => ({
			ok: false,
			status: 403,
			json: async () => ({ message: "API rate limit exceeded" }),
		});
		const offline: FetchLike = async () => {
			throw new TypeError("Load failed");
		};
		await expect(starsFromGitHub(rateLimited)).resolves.toBeNull();
		await expect(starsFromGitHub(offline)).resolves.toBeNull();
	});

	it("resolveStars falls back to the constant and says so, never throws", async () => {
		const warn = vi.fn();
		const offline: FetchLike = async () => {
			throw new TypeError("Load failed");
		};
		await expect(resolveStars({ fetchImpl: offline, warn })).resolves.toBe(
			FALLBACK_STARS,
		);
		expect(warn).toHaveBeenCalledOnce();
		await expect(
			resolveStars({ fetchImpl: okFetch({ stargazers_count: 42 }), warn }),
		).resolves.toBe(42);
	});
});
