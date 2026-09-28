import { getResolvedNav } from "./content";
import { SITE } from "./site";

/**
 * `/llms-full.txt` — every published page, in navigation order, as one
 * markdown document.
 *
 * The sibling `/llms.txt` is the INDEX (titles + descriptions + links); this
 * is the full text, for the agents that would otherwise fetch twenty raw
 * files. Both derive from the same source — the nav registry crossed with the
 * content tree — so this file cannot list a page the docs do not have, and
 * the bodies below are the byte-identical markdown `/raw/<slug>` serves
 * (`page.body`), never a re-render of the page. That is the drift-free
 * property the route exists for: one loader, three artifacts (HTML, raw, this
 * file), one truth.
 *
 * A page's own `# Title` heading is kept exactly as authored; the `###` above
 * each body is this file's own entry header, alongside the `Source:` line the
 * reader (or crawler) needs to cite the page it is reading.
 *
 * Drafts and planned routes are absent, like everywhere else that faces the
 * public: the filter is `status === "published"`, the same one the sidebar
 * and sitemap use.
 */
export function buildLlmsFullTxt(): string {
	const groups = getResolvedNav();
	const lines: string[] = [
		`# ${SITE.title}`,
		"",
		`> ${SITE.description}`,
		"",
		`Full text of every page on ${SITE.url}, in navigation order. Each entry is`,
		"preceded by its title and a `Source:` line; the body is the page's markdown",
		"exactly as `/raw/<slug>` serves it. The index of pages (titles and",
		"descriptions) is `/llms.txt`.",
		"",
	];

	for (const group of groups) {
		const items = group.items.filter((item) => item.status === "published");
		if (items.length === 0) continue;

		lines.push(`## ${group.title}`, "");
		for (const item of items) {
			const page = item.page;
			if (!page) continue;
			const title = page.title;
			lines.push(
				`### ${title}`,
				"",
				`Source: ${SITE.url}${item.href}`,
				"",
				page.body.trimEnd(),
				"",
			);
		}
	}

	return `${lines.join("\n")}\n`;
}
