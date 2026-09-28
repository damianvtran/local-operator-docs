import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocPage } from "@/components/layout/doc-page";
import { JsonLd } from "@/components/ui/json-ld";
import { getAllPages, getBreadcrumb, getPage } from "@/lib/content";
import { SITE } from "@/lib/site";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data";

/**
 * Every content page, one dynamic route.
 *
 * The route tree is generated from the content tree, NOT hand-maintained per
 * page: a new .md file plus one line in the nav registry is the whole recipe,
 * and `dynamicParams = false` makes anything not in the generated set a real
 * 404 rather than a late crash.
 */
export const dynamicParams = false;

export function generateStaticParams() {
	return getAllPages().map((page) => ({ slug: page.slug.split("/") }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const page = getPage(slug.join("/"));
	if (!page) return {};
	return {
		title: page.title,
		description: page.description,
		alternates: { canonical: page.href },
		openGraph: {
			title: page.title,
			description: page.description,
			url: page.href,
			/*
			 * The site name is restated because a page-level `openGraph` REPLACES
			 * the root one rather than merging into it - without this line the
			 * docs pages emitted no `og:site_name` at all, which is the field
			 * that names the site on a share card.
			 */
			siteName: SITE.title,
			type: "article",
			images: [
				{
					url: SITE.ogImage.path,
					width: SITE.ogImage.width,
					height: SITE.ogImage.height,
					alt: SITE.ogImage.alt,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: page.title,
			description: page.description,
			images: [SITE.ogImage.path],
		},
	};
}

export default async function ContentPage({
	params,
}: {
	params: Promise<{ slug: string[] }>;
}) {
	const { slug } = await params;
	const page = getPage(slug.join("/"));
	if (!page) notFound();

	/*
	 * Structured data for the page kind the crawlers ask about: the article
	 * itself plus the trail the breadcrumbs draw on screen (the group names a
	 * section, not a URL - sections have no landing pages; see
	 * `structured-data.ts`).
	 */
	const crumb = getBreadcrumb(page.slug);

	return (
		<>
			<JsonLd
				data={articleSchema({
					title: page.title,
					description: page.description,
					href: page.href,
				})}
			/>
			<JsonLd
				data={breadcrumbSchema({
					title: page.title,
					group: crumb.group,
					href: page.href,
				})}
			/>
			<DocPage page={page} />
		</>
	);
}
