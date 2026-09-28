import { describe, expect, it } from "vitest";
import type { LoadedPage } from "@/lib/content";
import {
	collectValidationErrors,
	getAllPages,
	getSidebarNav,
} from "@/lib/content";
import type { Frontmatter } from "@/lib/frontmatter";
import { buildSearchIndex } from "@/lib/search/index-gen";

describe("nav registry x content", () => {
	it("validates cleanly today", () => {
		expect(collectValidationErrors(getAllPages())).toEqual([]);
	});

	it("renders only published items in the sidebar", () => {
		const groups = getSidebarNav();
		const items = groups.flatMap((group) => group.items);
		expect(items.length).toBeGreaterThan(0);
		expect(items.every((item) => item.status === "published")).toBe(true);
		// Drafts and planned pages stay out of the rendered sidebar ...
		expect(items.some((item) => item.slug === "surfaces/mobile-relay")).toBe(
			false,
		);
		expect(items.some((item) => item.slug === "capabilities/agent-mesh")).toBe(
			false,
		);
		// ... while the real pages are in.
		expect(items.some((item) => item.slug === "getting-started/install")).toBe(
			true,
		);
		expect(items.some((item) => item.slug === "surfaces/desktop")).toBe(true);
		expect(items.some((item) => item.slug === "tui/quickstart")).toBe(true);
	});

	it("catches an unregistered content file", () => {
		const pages = getAllPages();
		const stray: LoadedPage = {
			...pages[0],
			slug: "stray/page",
			file: "stray/page.md",
		};
		const errors = collectValidationErrors([...pages, stray]);
		expect(errors.some((error) => error.includes("stray/page.md"))).toBe(true);
	});

	it("catches a wrong order value", () => {
		const pages = getAllPages();
		const wrong: LoadedPage = {
			...pages[0],
			frontmatter: { ...pages[0].frontmatter, order: 99 } as Frontmatter,
		};
		const errors = collectValidationErrors([wrong, ...pages.slice(1)]);
		expect(errors.some((error) => error.includes("order 99"))).toBe(true);
	});

	it("catches a duplicate slug", () => {
		const pages = getAllPages();
		const errors = collectValidationErrors([...pages, { ...pages[0] }]);
		expect(errors.some((error) => error.includes("duplicate slug"))).toBe(true);
	});
});

describe("search index completeness", () => {
	it("indexes every content file, every section, and the home page", () => {
		const index = buildSearchIndex();
		expect(index.entries.length).toBeGreaterThan(0);
		expect(index.entries.some((entry) => entry.url === "/")).toBe(true);

		for (const page of getAllPages()) {
			const pageEntries = index.entries.filter(
				(entry) => entry.url === page.href,
			);
			expect(
				pageEntries.length,
				`${page.slug} missing a page entry`,
			).toBeGreaterThan(0);
			for (const section of page.sections) {
				const url = `${page.href}#${section.anchor}`;
				expect(
					index.entries.some((entry) => entry.url === url),
					`${url} missing from the index`,
				).toBe(true);
			}
		}
	});
});
