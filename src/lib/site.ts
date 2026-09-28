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
	title: "Local Operator docs",
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
	 * The Local Operator release these docs were written against (recon of
	 * 2026-09-28 read v0.64.1 from the runtime's pyproject.toml, and the
	 * surface facts in these pages — mesh, wakes, sessions — landed through
	 * v0.63.x–v0.64.x). The top-bar version chip is informational; bump this
	 * in a release sweep when documented behaviour moves, not on every
	 * runtime tag.
	 */
	productVersion: "0.64.1",
} as const;

/** Route for a content slug, e.g. `getting-started/install` -> `/getting-started/install`. */
export function docPath(slug: string): string {
	return `/${slug.replace(/^\/+|\/+$/g, "")}`;
}

/** The raw-markdown endpoint a page's "Copy page" action fetches. */
export function rawPath(slug: string): string {
	return `/raw/${slug.replace(/^\/+|\/+$/g, "")}`;
}
