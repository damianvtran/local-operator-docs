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
	discord: "https://discord.gg/cSXBfBMd",
	email: "contact@local-operator.com",
	marketing: "https://local-operator.com",
	downloads: "https://local-operator.com/download",

	/** The canonical terminal install; the hero chip copies exactly this. */
	installCommand: "pip install local-operator",

	/**
	 * The Local Operator release these docs were written against (recon of
	 * 2026-09-27 read v0.61.9 from the runtime's pyproject.toml). The top-bar
	 * version chip is informational; bump this in a release sweep when
	 * documented behaviour moves, not on every runtime tag.
	 */
	productVersion: "0.61.9",
} as const;

/** Route for a content slug, e.g. `getting-started/install` -> `/getting-started/install`. */
export function docPath(slug: string): string {
	return `/${slug.replace(/^\/+|\/+$/g, "")}`;
}

/** The raw-markdown endpoint a page's "Copy page" action fetches. */
export function rawPath(slug: string): string {
	return `/raw/${slug.replace(/^\/+|\/+$/g, "")}`;
}
