import { getAllPages, getPage } from "@/lib/content";

/**
 * `/raw/<slug>` — the page's markdown source, exactly as authored (minus
 * frontmatter). This is what the "Copy page" button fetches and what
 * `llms.txt` points agents at; it exists so both can share one source
 * instead of scraping rendered HTML.
 *
 * Prerendered for every content page (`dynamic = "force-static"`).
 */
export const dynamic = "force-static";

export function generateStaticParams() {
	return getAllPages().map((page) => ({ slug: page.slug.split("/") }));
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ slug: string[] }> },
): Promise<Response> {
	const { slug } = await params;
	const page = getPage(slug.join("/"));
	if (!page) {
		return new Response("Not found", { status: 404 });
	}
	return new Response(page.body, {
		headers: {
			"content-type": "text/markdown; charset=utf-8",
			"cache-control": "public, max-age=3600",
		},
	});
}
