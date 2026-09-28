import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { TopBar } from "@/components/layout/top-bar";
import { SearchProvider } from "@/components/search/search-provider";
import { getResolvedNav, getSidebarNav } from "@/lib/content";
import { SITE } from "@/lib/site";
import { THEME_SCRIPT } from "@/lib/theme";
import { monoFont } from "./fonts";
import "./globals.css";

/**
 * The root shell.
 *
 * Three things here are load-bearing:
 *   - the inline THEME_SCRIPT runs BEFORE first paint, so the stored theme is
 *     applied to <html> with no flash of the wrong palette;
 *   - the nav data is computed on the server from the registry x content and
 *     handed to the client top bar / sidebar as plain data;
 *   - SearchProvider owns every global key (⌘K, /, ?, g-chords) and the
 *     palette, so no component has to know where they live;
 *   - the mono font variable class sits on <html>, NOT <body>: `--font-mono`
 *     in globals.css references it from `:root`, and a var() reference is
 *     resolved where its custom property is COMPUTED — a body-scoped class
 *     leaves the mapping invalid for every inheriting element, which is how
 *     the whole site silently rendered in the sans fallback until round-1
 *     D1/Q1 (fonts.ts states the same constraint).
 */
export const metadata: Metadata = {
	metadataBase: new URL(SITE.url),
	title: {
		default: SITE.title,
		template: `%s · ${SITE.name} Docs`,
	},
	description: SITE.description,
	/*
	 * The home page's canonical. Content pages set their own (`(docs)`
	 * `generateMetadata`), so nothing inherits a canonical that would point at
	 * the wrong route - this is the one page that relies on the default.
	 */
	alternates: { canonical: "/" },
	/*
	 * The icon set, mirrored from the marketing site's own <head> (its
	 * index.html is the source of these four sizes plus the shortcut and
	 * apple links), and served from `public/` so there is ONE convention -
	 * a second location (`src/app/favicon.ico`) would double up on the
	 * emitted links. The files are the marketing set, copied byte-for-byte,
	 * so the two sites show the same browser mark.
	 */
	icons: {
		icon: [
			{ url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
			{ url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
			{ url: "/favicon-192x192.png", type: "image/png", sizes: "192x192" },
			{ url: "/favicon-512x512.png", type: "image/png", sizes: "512x512" },
		],
		shortcut: "/favicon.ico",
		apple: [{ url: "/favicon-180x180.png", sizes: "180x180" }],
	},
	manifest: "/manifest.json",
	openGraph: {
		title: SITE.title,
		description: SITE.description,
		url: SITE.url,
		siteName: SITE.title,
		type: "website",
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
		/* `summary_large_image` because there IS a 1200x630 card now; the
		 * small `summary` card letterboxes it. */
		card: "summary_large_image",
		title: SITE.title,
		description: SITE.description,
		images: [SITE.ogImage.path],
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	const groups = getSidebarNav().map((group) => ({
		id: group.id,
		title: group.title,
		items: group.items.map((item) => ({
			id: item.id,
			title: item.title,
			href: item.href,
		})),
	}));

	// For the navigation chords: everything routable today (published AND
	// drafts — drafts are linked from home, so `g m` must reach them).
	const availableSlugs = getResolvedNav()
		.flatMap((group) => group.items)
		.filter((item) => item.status !== "planned")
		.map((item) => item.slug);

	return (
		<html
			lang="en"
			className={`${monoFont.variable} dark`}
			data-theme="localOperatorDark"
			suppressHydrationWarning
		>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: a static, dependency-free string from lib/theme.ts */}
				<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
			</head>
			<body className="min-h-dvh bg-canvas font-sans text-body text-ink antialiased">
				<a href="#main" className="lo-skip-link">
					Skip to content
				</a>
				<SearchProvider availableSlugs={availableSlugs}>
					<TopBar groups={groups} />
					<div id="main">{children}</div>
					<Footer />
				</SearchProvider>
			</body>
		</html>
	);
}
