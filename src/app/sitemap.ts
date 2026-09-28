import type { MetadataRoute } from "next";
import { getSidebarNav } from "@/lib/content";
import { SITE } from "@/lib/site";

/** Published pages only; drafts and planned routes stay out of the sitemap. */
export default function sitemap(): MetadataRoute.Sitemap {
	const pages = getSidebarNav().flatMap((group) => group.items);
	return [
		{ url: SITE.url, changeFrequency: "weekly", priority: 1 },
		...pages.map((page) => ({
			url: `${SITE.url}${page.href}`,
			changeFrequency: "weekly" as const,
			priority: 0.8,
		})),
	];
}
