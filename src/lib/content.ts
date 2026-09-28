import fs from "node:fs";
import path from "node:path";
import Markdoc, { type Node } from "@markdoc/markdoc";
import { type Frontmatter, parseFrontmatter } from "./frontmatter";
import {
	assignHeadingIds,
	extractHeadingText,
	type TocEntry,
} from "./headings";
import { NAV, NAV_ITEMS, type NavItem } from "./nav";

/**
 * The content layer: load `content/**\/*.md`, validate it against the nav
 * registry, and derive everything a page render or the search index needs.
 *
 * No React imports live here on purpose — the search-index generator, the
 * llms.txt/raw route handlers and the unit tests all run this module in plain
 * Node.
 *
 * ## The consistency gate
 *
 * `loadPages()` THROWS when the registry and the content tree disagree
 * (unknown section, wrong order, an unregistered file). That is deliberate:
 * this is the check the brief named as the fix for radient-docs' hardcoded
 * sidebar drift, and it must fire at build time, not in a lint someone skips.
 * `collectValidationErrors()` exposes the same findings for tests.
 */

export type PageSection = {
	anchor: string;
	heading: string;
	level: 2 | 3;
	text: string;
	code: string;
};

export type LoadedPage = {
	slug: string;
	href: string;
	/** Path relative to the content root, e.g. `getting-started/install.md`. */
	file: string;
	frontmatter: Frontmatter;
	/** Frontmatter title, else the first H1, else the registry label. */
	title: string;
	description: string;
	draft: boolean;
	/** Markdown source after the frontmatter block (what /raw serves). */
	body: string;
	ast: Node;
	toc: TocEntry[];
	sections: PageSection[];
	/** Prose before the first h2/h3, for the page-level search entry. */
	introText: string;
	introCode: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content");

/* ------------------------------------------------------------------ */
/* AST helpers                                                         */
/* ------------------------------------------------------------------ */

function collect(node: Node, into: { text: string[]; code: string[] }): void {
	for (const child of node.children ?? []) {
		switch (child.type) {
			case "text":
				into.text.push(String(child.attributes.content ?? ""));
				break;
			case "softbreak":
			case "hardbreak":
				into.text.push(" ");
				break;
			case "code": {
				// Inline code is prose the reader retypes — it belongs in both the
				// text field (so a sentence query matches) and the code field.
				const value = String(child.attributes.content ?? "");
				into.text.push(value);
				into.code.push(value);
				break;
			}
			case "fence":
				into.code.push(String(child.attributes.content ?? ""));
				break;
			case "heading":
				break; // sectioning handles headings
			default:
				collect(child, into);
		}
	}
}

function splitSections(ast: Node): {
	sections: PageSection[];
	introText: string;
	introCode: string;
} {
	const sections: Array<{
		anchor: string;
		heading: string;
		level: 2 | 3;
		text: string[];
		code: string[];
	}> = [];
	const intro = { text: [] as string[], code: [] as string[] };
	let current: (typeof sections)[number] | null = null;

	for (const child of ast.children ?? []) {
		if (child.type === "heading") {
			const level = Number(child.attributes.level);
			if (level === 1) continue; // the page title
			const heading = extractHeadingText(child);
			if (level === 2 || level === 3) {
				current = {
					anchor: String(child.attributes.id ?? ""),
					heading,
					level,
					text: [],
					code: [],
				};
				sections.push(current);
			} else if (current) {
				current.text.push(heading);
			} else {
				intro.text.push(heading);
			}
			continue;
		}
		collect(child, current ?? intro);
	}

	return {
		sections: sections.map((section) => ({
			anchor: section.anchor,
			heading: section.heading,
			level: section.level,
			text: normalize(section.text.join(" ")),
			code: section.code.join("\n").trim(),
		})),
		introText: normalize(intro.text.join(" ")),
		introCode: intro.code.join("\n").trim(),
	};
}

function normalize(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

function firstH1(ast: Node): string | undefined {
	for (const child of ast.children ?? []) {
		if (child.type === "heading" && Number(child.attributes.level) === 1) {
			return extractHeadingText(child);
		}
	}
	return undefined;
}

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

function listContentFiles(dir: string, prefix = ""): string[] {
	const out: string[] = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			out.push(...listContentFiles(path.join(dir, entry.name), rel));
		} else if (entry.isFile()) {
			out.push(rel);
		}
	}
	return out;
}

function loadPage(file: string): LoadedPage {
	const source = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
	const { data, body } = parseFrontmatter(source, file);
	const ast = Markdoc.parse(body);
	const toc = assignHeadingIds(ast);
	const slug = file.replace(/\.md$/, "");
	const registryItem = NAV_ITEMS.find((item) => item.slug === slug);
	const { sections, introText, introCode } = splitSections(ast);

	return {
		slug,
		href: `/${slug}`,
		file,
		frontmatter: data as Frontmatter,
		title: data.title ?? firstH1(ast) ?? registryItem?.title ?? slug,
		description: data.description ?? "",
		draft: data.draft === true,
		body,
		ast,
		toc,
		sections,
		introText,
		introCode,
	};
}

let cachedPages: LoadedPage[] | null = null;

/**
 * Loads and validates every page. Throws (with every problem listed) when the
 * registry and the content tree diverge — see `collectValidationErrors`.
 */
export function loadPages(): LoadedPage[] {
	if (cachedPages) return cachedPages;
	const files = listContentFiles(CONTENT_DIR).filter((file) =>
		file.endsWith(".md"),
	);
	const pages = files.map(loadPage);
	const errors = collectValidationErrors(pages);
	if (errors.length > 0) {
		throw new Error(
			`Content/nav validation failed:\n${errors.map((error) => `  - ${error}`).join("\n")}`,
		);
	}
	cachedPages = pages;
	return pages;
}

/** The validation above, as a value — used by tests and by the build. */
export function collectValidationErrors(pages: LoadedPage[]): string[] {
	const errors: string[] = [];
	const seen = new Set<string>();
	const registeredSlugs = new Set(NAV_ITEMS.map((item) => item.slug));

	for (const page of pages) {
		if (seen.has(page.slug))
			errors.push(`${page.file}: duplicate slug "${page.slug}"`);
		seen.add(page.slug);

		const item = NAV_ITEMS.find((candidate) => candidate.slug === page.slug);
		if (!item) {
			errors.push(
				`${page.file}: not registered in src/lib/nav.ts (add the item, or move the file out of content/)`,
			);
			continue;
		}

		const group = NAV.find((candidate) => candidate.items.includes(item));
		if (!group) {
			errors.push(`${page.file}: registered but has no group`);
			continue;
		}

		const { description, section, order } = page.frontmatter;
		if (!description || typeof description !== "string") {
			errors.push(`${page.file}: frontmatter "description" is required`);
		}
		if (!section) {
			errors.push(
				`${page.file}: frontmatter "section" is required (group id "${group.id}")`,
			);
		} else if (section !== group.id) {
			errors.push(
				`${page.file}: frontmatter section "${section}" != registry group "${group.id}"`,
			);
		}
		const position = group.items.indexOf(item) + 1;
		if (order === undefined) {
			errors.push(
				`${page.file}: frontmatter "order" is required (expected ${position})`,
			);
		} else if (order !== position) {
			errors.push(
				`${page.file}: frontmatter order ${order} != registry position ${position} (order items in nav.ts and numbers must agree)`,
			);
		}
		if (
			page.frontmatter.draft !== undefined &&
			typeof page.frontmatter.draft !== "boolean"
		) {
			errors.push(`${page.file}: frontmatter "draft" must be true or false`);
		}
		if (
			page.frontmatter.title !== undefined &&
			typeof page.frontmatter.title !== "string"
		) {
			errors.push(
				`${page.file}: frontmatter "title" must be a string when present`,
			);
		}
	}

	// Registry side: no duplicate slugs/hrefs, and no two items pointing at the
	// same file.
	const slugs = new Map<string, NavItem>();
	for (const item of NAV_ITEMS) {
		if (slugs.has(item.slug)) {
			errors.push(
				`nav.ts: duplicate slug "${item.slug}" (${slugs.get(item.slug)?.id} and ${item.id})`,
			);
		}
		slugs.set(item.slug, item);
	}
	if (registeredSlugs.size !== NAV_ITEMS.length) {
		errors.push("nav.ts: duplicate slugs across items");
	}

	return errors;
}

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export function getPage(slug: string): LoadedPage | undefined {
	return loadPages().find((page) => page.slug === slug);
}

export function getPageOrThrow(slug: string): LoadedPage {
	const page = getPage(slug);
	if (!page) throw new Error(`No content page for slug "${slug}"`);
	return page;
}

/** Every page — including drafts, which are routable but unlisted. */
export function getAllPages(): LoadedPage[] {
	return loadPages();
}

/* ------------------------------------------------------------------ */
/* Nav resolution (registry x content)                                 */
/* ------------------------------------------------------------------ */

export type ResolvedItem = NavItem & {
	status: "published" | "draft" | "planned";
	href: string;
	page?: LoadedPage;
};

export type ResolvedGroup = {
	id: string;
	title: string;
	items: ResolvedItem[];
};

function resolveItem(item: NavItem): ResolvedItem {
	const page = getPage(item.slug);
	const status: ResolvedItem["status"] = page
		? page.draft
			? "draft"
			: "published"
		: "planned";
	return { ...item, status, href: `/${item.slug}`, page };
}

/** Every group, with per-item availability resolved. */
export function getResolvedNav(): ResolvedGroup[] {
	return NAV.map((group) => ({
		id: group.id,
		title: group.title,
		items: group.items.map(resolveItem),
	}));
}

/**
 * What the sidebar renders: published items only. Groups with nothing
 * published are dropped entirely rather than rendered as empty headings.
 */
export function getSidebarNav(): ResolvedGroup[] {
	return getResolvedNav()
		.map((group) => ({
			...group,
			items: group.items.filter((item) => item.status === "published"),
		}))
		.filter((group) => group.items.length > 0);
}

/**
 * Previous/next for the pager, over the published pages in registry order.
 * Drafts and planned items do not participate.
 */
export function getPager(slug: string): {
	prev?: ResolvedItem;
	next?: ResolvedItem;
} {
	const published = getResolvedNav()
		.flatMap((group) => group.items)
		.filter((item) => item.status === "published");
	const index = published.findIndex((item) => item.slug === slug);
	if (index === -1) return {};
	return {
		prev: index > 0 ? published[index - 1] : undefined,
		next: index < published.length - 1 ? published[index + 1] : undefined,
	};
}

export function getBreadcrumb(slug: string): {
	group?: string;
	title?: string;
} {
	for (const group of NAV) {
		for (const item of group.items) {
			if (item.slug === slug) {
				const page = getPage(slug);
				return { group: group.title, title: page?.title ?? item.title };
			}
		}
	}
	return {};
}
