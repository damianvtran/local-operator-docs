import { SITE } from "./site";

/**
 * JSON-LD for the two page kinds this site has: the home page describing the
 * product, and each docs page describing itself.
 *
 * WHY JSON-LD RATHER THAN MICRODATA: one script tag per page cannot drift
 * from the rendered DOM, and search engines plus the AI crawlers that read
 * the site (llms.txt lists them) consume it directly. Every builder here is
 * pure — the tests pin the shapes, and the pages only serialize what this
 * module returns, so no page can emit hand-rolled markup.
 *
 * The shapes follow the current guidance for docs properties:
 *
 *   - home: `WebSite` (the property itself) plus `SoftwareApplication` (what
 *     the docs are about — free, MIT, macOS/Windows/Linux, with the version
 *     the build resolved);
 *   - docs pages: `TechArticle` (schema.org's article subtype for technical
 *     documentation) plus a `BreadcrumbList` that mirrors the visible trail.
 *
 * The breadcrumb's middle item names the section, not a URL, because
 * sections have no landing pages (`breadcrumbs.tsx` says the same and for the
 * same reason). A breadcrumb that links nowhere is worse than one that names
 * where you are — in schema as on screen.
 */

export type JsonLdObject = Record<string, unknown>;

export function websiteSchema(): JsonLdObject {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE.title,
		url: SITE.url,
		description: SITE.description,
		inLanguage: "en",
	};
}

/**
 * `SoftwareApplication`, the entity the docs property documents.
 *
 * `softwareVersion` is the version the build resolved (GitHub Releases →
 * PyPI → the committed fallback — see `versions.ts`), so structured data and
 * the top-bar chip cannot disagree about which release these docs describe.
 */
export function softwareApplicationSchema(version: string): JsonLdObject {
	return {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: SITE.name,
		description: SITE.description,
		url: SITE.marketing,
		applicationCategory: "DeveloperApplication",
		operatingSystem: "macOS, Windows, Linux",
		softwareVersion: version,
		isAccessibleForFree: true,
		license: "https://opensource.org/license/mit",
		downloadUrl: SITE.downloads,
		codeRepository: SITE.github,
		sameAs: [SITE.github, SITE.marketing],
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
	};
}

const organization = (): JsonLdObject => ({
	"@type": "Organization",
	name: SITE.name,
	url: SITE.marketing,
});

export function articleSchema(page: {
	title: string;
	description: string;
	href: string;
}): JsonLdObject {
	return {
		"@context": "https://schema.org",
		"@type": "TechArticle",
		headline: page.title,
		description: page.description,
		url: `${SITE.url}${page.href}`,
		inLanguage: "en",
		isPartOf: {
			"@type": "WebSite",
			name: SITE.title,
			url: SITE.url,
		},
		publisher: organization(),
		author: organization(),
	};
}

export function breadcrumbSchema(page: {
	title: string;
	group?: string;
	href: string;
}): JsonLdObject {
	const items: JsonLdObject[] = [
		{
			"@type": "ListItem",
			position: 1,
			name: "Docs",
			item: `${SITE.url}/`,
		},
	];
	if (page.group) {
		items.push({ "@type": "ListItem", position: 2, name: page.group });
	}
	items.push({
		"@type": "ListItem",
		position: items.length + 1,
		name: page.title,
		item: `${SITE.url}${page.href}`,
	});
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items,
	};
}
