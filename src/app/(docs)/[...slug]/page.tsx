import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocPage } from "@/components/layout/doc-page";
import { getAllPages, getPage } from "@/lib/content";

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
	return <DocPage page={page} />;
}
