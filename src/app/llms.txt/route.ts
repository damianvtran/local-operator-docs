import { getResolvedNav } from "@/lib/content";
import { SITE } from "@/lib/site";

/**
 * `/llms.txt` — the agent-readable index of this site.
 *
 * Generated from the nav registry x content (the same source the sidebar
 * uses), so it cannot list a page the docs do not have. Published pages only;
 * drafts and planned routes are deliberately absent. Each page is also
 * available as raw markdown at `/raw/<slug>`.
 */
export const dynamic = "force-static";

export function GET(): Response {
	const groups = getResolvedNav();
	const lines: string[] = [`# ${SITE.title}`, "", `> ${SITE.description}`, ""];

	for (const group of groups) {
		const items = group.items.filter((item) => item.status === "published");
		if (items.length === 0) continue;
		lines.push(`## ${group.title}`, "");
		for (const item of items) {
			const title = item.page?.title ?? item.title;
			const description = item.page?.description ?? "";
			lines.push(
				`- [${title}](${SITE.url}${item.href})${description ? `: ${description}` : ""}`,
			);
		}
		lines.push("");
	}

	lines.push(
		"## Notes",
		"",
		"- The full text of every page above, in one file, is at `/llms-full.txt`.",
		"- Every page above is also available as raw markdown at `/raw/<slug>` — e.g. `/raw/getting-started/install`.",
		"- The site search index is a static file at `/search-index.json`.",
		"- Local Operator itself lives at https://github.com/damianvtran/local-operator (MIT).",
		"",
	);

	return new Response(lines.join("\n"), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
