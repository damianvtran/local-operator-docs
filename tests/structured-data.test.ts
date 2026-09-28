import { describe, expect, it } from "vitest";
import { SITE } from "@/lib/site";
import {
	articleSchema,
	breadcrumbSchema,
	softwareApplicationSchema,
	websiteSchema,
} from "@/lib/structured-data";

/**
 * The structured-data builders' shapes.
 *
 * Each schema is built, checked for the fields a crawler keys on, and
 * round-tripped through JSON — the pages serialize exactly `JSON.stringify`
 * of these objects, so a value that cannot survive the stringify/parse pair
 * (an undefined, a function, a cycle) would ship as invalid JSON. The
 * round-trip is not ceremony: it is the same guarantee the emitted
 * `application/ld+json` scripts rely on.
 */

const roundTrips = (value: object) => {
	const parsed = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
	expect(parsed).toEqual(value);
	return parsed;
};

describe("website schema", () => {
	it("is a WebSite naming this property", () => {
		const schema = roundTrips(websiteSchema());
		expect(schema["@context"]).toBe("https://schema.org");
		expect(schema["@type"]).toBe("WebSite");
		expect(schema.url).toBe(SITE.url);
		expect(schema.name).toBe(SITE.title);
	});
});

describe("software application schema", () => {
	it("names the app, its version and its licence, free of charge", () => {
		const schema = roundTrips(softwareApplicationSchema("9.9.9"));
		expect(schema["@type"]).toBe("SoftwareApplication");
		expect(schema.softwareVersion).toBe("9.9.9");
		expect(schema.offers).toEqual({
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		});
		expect(schema.codeRepository).toBe(SITE.github);
	});
});

describe("article schema", () => {
	it("is a TechArticle with an absolute url", () => {
		const schema = roundTrips(
			articleSchema({
				title: "Quickstart",
				description: "Five minutes to the first task.",
				href: "/getting-started/quickstart",
			}),
		);
		expect(schema["@type"]).toBe("TechArticle");
		expect(schema.headline).toBe("Quickstart");
		expect(schema.url).toBe(`${SITE.url}/getting-started/quickstart`);
		expect(schema.isPartOf).toMatchObject({ "@type": "WebSite" });
	});
});

describe("breadcrumb schema", () => {
	it("lists Home → Page when there is no group, positions in order", () => {
		const schema = roundTrips(
			breadcrumbSchema({
				title: "Quickstart",
				href: "/getting-started/quickstart",
			}),
		);
		const items = schema.itemListElement as Array<Record<string, unknown>>;
		expect(items).toHaveLength(2);
		expect(items[0]).toMatchObject({ position: 1, name: "Docs" });
		expect(items[1]).toMatchObject({
			position: 2,
			name: "Quickstart",
			item: `${SITE.url}/getting-started/quickstart`,
		});
	});

	it("names the section as a middle step, without inventing a URL", () => {
		const schema = roundTrips(
			breadcrumbSchema({
				title: "Quickstart",
				group: "Get started",
				href: "/getting-started/quickstart",
			}),
		);
		const items = schema.itemListElement as Array<Record<string, unknown>>;
		expect(items).toHaveLength(3);
		expect(items[1]).toEqual({
			"@type": "ListItem",
			position: 2,
			name: "Get started",
		});
		expect(items[1]).not.toHaveProperty("item");
		expect(items[2]).toMatchObject({ position: 3, name: "Quickstart" });
	});
});
