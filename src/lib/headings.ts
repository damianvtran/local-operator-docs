import type { Node } from "@markdoc/markdoc";

/**
 * Heading ids and table-of-contents extraction.
 *
 * This module deliberately has no React import: `scripts/check-design-system.mjs`
 * and the content validator run it in plain Node, and a guard that cannot be
 * loaded is a guard that does not run.
 */

/** Lowercase, alphanumerics and single dashes; empty text still gets an id. */
export function slugify(text: string): string {
	return (
		text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "section"
	);
}

/**
 * Returns a slug unique within one document, appending -2, -3, ...
 *
 * The registry keys on PRODUCED ids, not only on base slugs. A registry that
 * only counts base occurrences hands out the same suffixed id twice when a
 * heading's own text slugifies to an earlier suffix ("Errors", "Errors",
 * "Errors 2" must produce "errors", "errors-2", "errors-2-2" — not a
 * duplicate "errors-2"). Heading ids are user-visible URLs, so a collision
 * ships silently and permanently breaks a deep link.
 */
export function uniqueSlug(
	registry: Map<string, number>,
	text: string,
): string {
	const base = slugify(text);
	if (!registry.has(base)) {
		registry.set(base, 1);
		return base;
	}
	let n = registry.get(base) ?? 1;
	let candidate = `${base}-${n + 1}`;
	while (registry.has(candidate)) {
		n += 1;
		candidate = `${base}-${n + 1}`;
	}
	registry.set(base, n + 1);
	registry.set(candidate, 1);
	return candidate;
}

/** One entry in a page's table of contents. */
export type TocEntry = {
	id: string;
	text: string;
	level: 2 | 3;
};

/** Flattens a heading node's inline children to plain text. */
export function extractHeadingText(node: Node): string {
	let out = "";
	for (const child of node.walk()) {
		if (child.type === "text" && typeof child.attributes.content === "string") {
			out += child.attributes.content;
		} else if (
			child.type === "code" &&
			typeof child.attributes.content === "string"
		) {
			out += child.attributes.content;
		}
	}
	return out.trim();
}

/**
 * Walks the AST once and gives every heading a unique `id`, collecting the
 * h2/h3 entries for the TOC on the same pass. Tables encountered before the
 * next heading are stamped with their section's name (the `section`
 * attribute declared in markdoc-config), so each table region gets an
 * accessible name identifying WHICH table it is.
 *
 * One pass, not two: the TOC link and the rendered heading must agree on the
 * id including its dedupe suffix, and deriving the slug twice is how the
 * second "Install" on a page links to the first. h4+ is deliberately absent
 * from the TOC — a 21-entry rail is a second scrolling problem, not a
 * wayfinding device.
 */
export function assignHeadingIds(ast: Node): TocEntry[] {
	const registry = new Map<string, number>();
	const toc: TocEntry[] = [];
	let currentSection = "";

	for (const node of ast.walk()) {
		if (node.type === "table") {
			if (currentSection) node.attributes.section = currentSection;
			continue;
		}
		if (node.type !== "heading") continue;
		const text = extractHeadingText(node);
		if (!text) continue;
		const id = uniqueSlug(registry, text);
		node.attributes.id = id;
		currentSection = text;
		const level = node.attributes.level;
		if (level === 2 || level === 3) toc.push({ id, text, level });
	}

	return toc;
}
