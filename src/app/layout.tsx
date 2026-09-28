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
 *     palette, so no component has to know where they live.
 */
export const metadata: Metadata = {
	metadataBase: new URL(SITE.url),
	title: {
		default: SITE.title,
		template: `%s · ${SITE.name} Docs`,
	},
	description: SITE.description,
	openGraph: {
		title: SITE.title,
		description: SITE.description,
		url: SITE.url,
		siteName: SITE.title,
		type: "website",
	},
	twitter: {
		card: "summary",
		title: SITE.title,
		description: SITE.description,
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
			className="dark"
			data-theme="localOperatorDark"
			suppressHydrationWarning
		>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: a static, dependency-free string from lib/theme.ts */}
				<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
			</head>
			<body
				className={`${monoFont.variable} min-h-dvh bg-canvas font-sans text-body text-ink antialiased`}
			>
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
