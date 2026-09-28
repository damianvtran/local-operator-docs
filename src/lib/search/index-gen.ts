import { getAllPages, getBreadcrumb } from "../content";
import { SITE } from "../site";
import { tokenizeCode, tokenizeText } from "./tokenizer";
import type { EntryField, SearchEntry, SearchIndex } from "./types";

/**
 * Builds `public/search-index.json`.
 *
 * One entry per PAGE (title + description + intro prose) and one per h2/h3
 * SECTION, with the section's heading, prose and code kept in separate
 * fields so the scorer can weight them apart. Sections carry the anchor from
 * the same heading-id pass the rendered page uses, so every result
 * deep-links to the exact heading.
 *
 * Runs in Node only (imports the fs-backed content layer). `pnpm
 * generate-search-index` is wired into predev and prebuild, and fails loudly
 * on an empty index — the failure mode radient-docs hit where a missing
 * index silently answered every query with nothing.
 */

function makeEntry(args: {
	slug: string;
	anchor?: string;
	url: string;
	kind: "page" | "section";
	title: string;
	heading: string;
	breadcrumb: string;
	text: string;
	code: string;
	draft: boolean;
}): SearchEntry {
	const tokens: Record<EntryField, string[]> = {
		title: tokenizeText(args.title),
		heading: tokenizeText(args.heading),
		breadcrumb: tokenizeText(args.breadcrumb),
		text: tokenizeText(args.text),
		code: tokenizeCode(args.code),
	};
	return {
		id: `${args.slug || "home"}::${args.anchor || "page"}`,
		url: args.url,
		anchor: args.anchor ?? "",
		kind: args.kind,
		title: args.title,
		heading: args.heading,
		breadcrumb: args.breadcrumb,
		draft: args.draft,
		text: args.text,
		code: args.code,
		tokens,
	};
}

export function buildSearchIndex(): SearchIndex {
	const entries: SearchEntry[] = [];

	// The home page is a route, not a content file; index it explicitly so
	// "start", "docs" and the product blurb resolve.
	entries.push(
		makeEntry({
			slug: "",
			url: "/",
			kind: "page",
			title: SITE.title,
			heading: "",
			breadcrumb: "Home",
			text: `${SITE.description} ${SITE.installCommand}.`,
			code: SITE.installCommand,
			draft: false,
		}),
	);

	for (const page of getAllPages()) {
		const crumb = getBreadcrumb(page.slug);
		const breadcrumb = crumb.group
			? `${crumb.group} / ${page.title}`
			: page.title;
		const pageText = [page.description, page.introText]
			.filter(Boolean)
			.join(" ");

		entries.push(
			makeEntry({
				slug: page.slug,
				url: page.href,
				kind: "page",
				title: page.title,
				heading: "",
				breadcrumb,
				text: pageText,
				code: page.introCode,
				draft: page.draft,
			}),
		);

		for (const section of page.sections) {
			entries.push(
				makeEntry({
					slug: page.slug,
					anchor: section.anchor,
					url: `${page.href}#${section.anchor}`,
					kind: "section",
					title: page.title,
					heading: section.heading,
					breadcrumb,
					text: section.text,
					code: section.code,
					draft: page.draft,
				}),
			);
		}
	}

	return {
		version: 1,
		generatedAt: new Date().toISOString(),
		entries,
	};
}
