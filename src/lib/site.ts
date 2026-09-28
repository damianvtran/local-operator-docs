/**
 * One place for the facts every surface needs: names, links, the install
 * command, and the product release these docs were written against.
 *
 * Why a module rather than literals in components: the footer, the hero, the
 * palette actions and the metadata blocks must agree, and a link that drifts
 * in one of five places is the classic docs-site rot. Everything downstream
 * imports from here.
 */
export const SITE = {
	name: "Local Operator",
	/* Capital "Docs": this is the home page's <title> and the og:site_name, so
	   the lowercase spelling it used to carry read like a draft in every tab
	   and share card (round-3 operator finding). Subpage titles append
	   "· Local Operator Docs" through the layout template, which already
	   capitalised it. */
	title: "Local Operator Docs",
	description:
		"Guides for the Local Operator agent runtime: the terminal UI, the desktop app, workflow automations, remote access, and building on top of it.",

	/** Canonical origin, used for metadataBase, sitemap and llms.txt. */
	url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://docs.local-operator.com",

	github: "https://github.com/damianvtran/local-operator",
	githubReleases: "https://github.com/damianvtran/local-operator/releases",
	email: "contact@local-operator.com",
	marketing: "https://local-operator.com",
	downloads: "https://local-operator.com/download",

	/**
	 * The default social card, rendered once into `public/og.png` (1200x630).
	 * Referenced by the root metadata and by every docs page, so a shared link
	 * never falls back to no image at all.
	 */
	ogImage: {
		path: "/og.png",
		width: 1200,
		height: 630,
		alt: "Local Operator Docs — run agents where your work lives.",
	},

	/** The canonical terminal install; the hero chip copies exactly this. */
	installCommand: "pip install local-operator",

	/**
	 * The LAST-KNOWN runtime version — a fallback, not the source. The live
	 * value comes from `public/versions.json` (written by
	 * `scripts/generate-versions.ts` at build: GitHub Releases → PyPI → this
	 * constant) and is refreshed in the browser between deploys by
	 * `use-version-refresh.ts`. No release sweep needs to touch this; see
	 * AGENTS.md, "Versions".
	 */
	productVersion: "0.64.1",

	/**
	 * The desktop app's last-known version — the `ui` fallback in the same
	 * chain (GitHub Releases → this constant; the app is not on PyPI).
	 */
	uiVersion: "0.31.13",
} as const;

/** Route for a content slug, e.g. `getting-started/install` -> `/getting-started/install`. */
export function docPath(slug: string): string {
	return `/${slug.replace(/^\/+|\/+$/g, "")}`;
}

/** The raw-markdown endpoint a page's "Copy page" action fetches. */
export function rawPath(slug: string): string {
	return `/raw/${slug.replace(/^\/+|\/+$/g, "")}`;
}
