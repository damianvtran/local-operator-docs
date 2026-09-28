import { describe, expect, it, vi } from "vitest";
import {
	backendFromVersionsPayload,
	compareSemver,
	FALLBACK_VERSIONS,
	type FetchLike,
	latestFromGitHub,
	latestFromPyPI,
	newestOf,
	parseSemver,
	parseVersionsFile,
	resolveVersions,
	stripVersionPrefix,
	tagFromReleasePayload,
	versionsFromFile,
} from "@/lib/versions";

/**
 * The version pipeline's contract: ordered fallbacks on the write side
 * (GitHub → PyPI → constant) and newest-wins on the read side, with every
 * failure path landing on a value rather than an error.
 *
 * These are the invariants the docs site depends on: the chip may go stale
 * for a rebuild, but it may never render nothing, never render an error, and
 * never move BACKWARDS.
 */

/** A fetch stub answering by URL substring; anything else 404s. */
function stubFetch(routes: Record<string, unknown>): FetchLike {
	return vi.fn(async (url: string) => {
		for (const [match, payload] of Object.entries(routes)) {
			if (url.includes(match)) {
				return { ok: true, status: 200, json: async () => payload };
			}
		}
		return { ok: false, status: 404, json: async () => ({}) };
	});
}

const failFetch: FetchLike = async () => {
	throw new TypeError("Load failed");
};

describe("semver parsing and ordering", () => {
	it("parses plain, prefixed and suffixed versions", () => {
		expect(parseSemver("0.64.1")).toEqual([0, 64, 1]);
		expect(parseSemver("v1.2.3")).toEqual([1, 2, 3]);
		expect(parseSemver("2.0.0-beta.1")).toEqual([2, 0, 0]);
		expect(stripVersionPrefix("v0.64.1")).toBe("0.64.1");
	});

	it("rejects anything that is not a semantic version", () => {
		expect(parseSemver("")).toBeNull();
		expect(parseSemver("latest")).toBeNull();
		expect(parseSemver("0.64")).toBeNull();
		expect(parseSemver(undefined)).toBeNull();
	});

	it("orders numerically, including across digit-count changes", () => {
		expect(compareSemver("0.64.1", "0.64.1")).toBe(0);
		expect(compareSemver("v0.64.1", "0.64.1")).toBe(0);
		expect(compareSemver("0.64.2", "0.64.1")).toBe(1);
		expect(compareSemver("0.64.9", "0.65.0")).toBe(-1);
		expect(compareSemver("0.9.0", "0.10.0")).toBe(-1);
		// A value that does not parse is older than anything real, so the
		// fallback constant can never outrank a release.
		expect(compareSemver("not-a-version", "0.64.1")).toBe(-1);
	});

	it("orders a prerelease before its release on equal triples", () => {
		expect(compareSemver("0.65.0-rc.1", "0.65.0")).toBe(-1);
		expect(compareSemver("0.65.0", "0.65.0-rc.1")).toBe(1);
		expect(compareSemver("v0.65.0-rc.1", "v0.65.0")).toBe(-1);
		// The release supersedes the same-numbered prerelease in either order,
		// rather than tying and letting arrival order decide.
		expect(newestOf("0.65.0-rc.1", "0.65.0")).toBe("0.65.0");
		expect(newestOf("0.65.0", "0.65.0-rc.1")).toBe("0.65.0");
	});

	it("newestOf takes the newest parseable value, first-wins on ties", () => {
		expect(newestOf("0.64.1", "0.64.0", "0.63.9")).toBe("0.64.1");
		expect(newestOf("0.64.1", "0.65.0")).toBe("0.65.0");
		expect(newestOf("0.64.1", null, undefined, "junk")).toBe("0.64.1");
		expect(newestOf(null, undefined)).toBeNull();
		// Never a downgrade: the current value wins an equal comparison.
		expect(newestOf("0.65.0", "0.65.0")).toBe("0.65.0");
	});
});

describe("payload guards", () => {
	it("reads tag_name, and refuses a payload whose tag is not a version", () => {
		expect(tagFromReleasePayload({ tag_name: "v0.64.1" })).toBe("0.64.1");
		expect(tagFromReleasePayload({ tag_name: "nightly" })).toBeNull();
		expect(tagFromReleasePayload({})).toBeNull();
		expect(tagFromReleasePayload(null)).toBeNull();
	});

	it("reads versions.json's backend field through the same guard", () => {
		expect(backendFromVersionsPayload({ backend: "0.65.0" })).toBe("0.65.0");
		expect(backendFromVersionsPayload({ backend: "v0.65.0" })).toBe("0.65.0");
		expect(backendFromVersionsPayload({ backend: 64 })).toBeNull();
		expect(backendFromVersionsPayload(null)).toBeNull();
	});
});

describe("versions.json parse and fallback merge", () => {
	it("parses a complete file", () => {
		const parsed = parseVersionsFile(
			JSON.stringify({
				backend: "0.65.0",
				ui: "0.32.0",
				generatedAt: "2026-09-28T12:00:00.000Z",
			}),
		);
		expect(parsed).toEqual({
			backend: "0.65.0",
			ui: "0.32.0",
			generatedAt: "2026-09-28T12:00:00.000Z",
		});
	});

	it("keeps the good field beside a bad one", () => {
		const parsed = parseVersionsFile(
			JSON.stringify({ backend: "0.65.0", ui: "not-a-version" }),
		);
		expect(parsed?.backend).toBe("0.65.0");
		expect(parsed?.ui).toBeUndefined();
	});

	it("returns null for text that is not an object", () => {
		expect(parseVersionsFile("{")).toBeNull();
		expect(parseVersionsFile('"a string"')).toBeNull();
		expect(parseVersionsFile("null")).toBeNull();
	});

	it("merges file over fallback, field by field", () => {
		expect(versionsFromFile(null)).toEqual({
			backend: FALLBACK_VERSIONS.backend,
			ui: FALLBACK_VERSIONS.ui,
			generatedAt: "",
		});
		const merged = versionsFromFile(
			JSON.stringify({ backend: "9.9.9", ui: "junk" }),
		);
		expect(merged.backend).toBe("9.9.9");
		expect(merged.ui).toBe(FALLBACK_VERSIONS.ui);
	});
});

describe("resolveVersions (the builder side)", () => {
	it("prefers GitHub Releases for both repos", async () => {
		const fetchImpl = stubFetch({
			"damianvtran/local-operator/releases/latest": { tag_name: "v0.65.0" },
			"damianvtran/local-operator-ui/releases/latest": { tag_name: "v0.32.0" },
		});
		const versions = await resolveVersions({
			fetchImpl,
			now: new Date("2026-09-28T12:00:00Z"),
		});
		expect(versions).toEqual({
			backend: "0.65.0",
			ui: "0.32.0",
			generatedAt: "2026-09-28T12:00:00.000Z",
		});
	});

	it("falls back to PyPI for the backend when GitHub fails, and to the constant for the app", async () => {
		const warn = vi.fn();
		const fetchImpl = stubFetch({
			"pypi.org/pypi/local-operator/json": { info: { version: "0.64.0" } },
		});
		const versions = await resolveVersions({
			fetchImpl,
			now: new Date("2026-09-28T12:00:00Z"),
			warn,
		});
		expect(versions.backend).toBe("0.64.0");
		expect(versions.ui).toBe(FALLBACK_VERSIONS.ui);
		// The PyPI rescue is announced (a reader must be able to tell a
		// GitHub-won build from a rescued one)...
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("PyPI"));
		// ...and so is the downgrade to the fallback constant for the app.
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining(FALLBACK_VERSIONS.ui),
		);
	});

	it("lands on the committed constants when every source fails", async () => {
		const warn = vi.fn();
		const versions = await resolveVersions({ fetchImpl: failFetch, warn });
		expect(versions.backend).toBe(FALLBACK_VERSIONS.backend);
		expect(versions.ui).toBe(FALLBACK_VERSIONS.ui);
		expect(warn).toHaveBeenCalledTimes(2);
	});
});

describe("source readers", () => {
	it("latestFromGitHub returns null (not a throw) for a non-2xx", async () => {
		expect(await latestFromGitHub("x/y", stubFetch({}))).toBeNull();
	});

	it("latestFromPyPI reads info.version", async () => {
		const fetchImpl = stubFetch({
			"pypi.org/pypi/local-operator/json": { info: { version: "1.2.3" } },
		});
		expect(await latestFromPyPI(fetchImpl)).toBe("1.2.3");
	});
});
