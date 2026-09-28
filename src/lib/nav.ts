/**
 * The single navigation registry.
 *
 * Every page this site will ever have is listed here, in display order, with
 * the group it belongs to. Content frontmatter references this registry (its
 * `section` must equal a group id and its `order` must equal the item's
 * position), and `src/lib/content.ts` fails the build when the two diverge.
 *
 * Availability is DERIVED, never declared twice:
 *   - item with no content file  -> planned; not rendered anywhere
 *   - content file with `draft: true` -> routable but hidden from the sidebar,
 *     the pager and llms.txt (linked from home as a preview)
 *   - everything else -> published
 *
 * That derivation is what stops the radient-docs failure mode this build was
 * briefed against: a hardcoded sidebar that must be remembered in a second
 * place silently drifts from the routes.
 */
export type NavItem = {
	id: string;
	/** Sidebar label. The page's own title lives in frontmatter / the H1. */
	title: string;
	/** Content slug; the route is `/${slug}`. */
	slug: string;
};

export type NavGroup = {
	id: string;
	title: string;
	items: NavItem[];
};

export const NAV: NavGroup[] = [
	{
		id: "get-started",
		title: "Get started",
		items: [
			{
				id: "what-is",
				title: "What is Local Operator?",
				slug: "getting-started/what-is-local-operator",
			},
			{
				id: "install",
				title: "Install & first run",
				slug: "getting-started/install",
			},
			{
				id: "quickstart",
				title: "Quickstart",
				slug: "getting-started/quickstart",
			},
			{
				id: "choose-your-surface",
				title: "Choose your surface",
				slug: "getting-started/choose-your-surface",
			},
			{
				id: "updating",
				title: "Updating Local Operator",
				slug: "getting-started/updating",
			},
		],
	},
	{
		id: "surfaces",
		title: "Surfaces",
		items: [
			{ id: "terminal", title: "Terminal (TUI)", slug: "tui/quickstart" },
			{ id: "desktop", title: "Desktop app", slug: "surfaces/desktop" },
			{
				id: "mobile-relay",
				title: "Mobile relay",
				slug: "surfaces/mobile-relay",
			},
			{
				id: "browser-extension",
				title: "Browser extension",
				slug: "surfaces/browser-extension",
			},
		],
	},
	{
		id: "capabilities",
		title: "Capabilities",
		items: [
			{
				id: "workflow-automations",
				title: "Workflow automations",
				slug: "capabilities/workflow-automations",
			},
			{
				id: "always-on",
				title: "Always-on & proactive agents",
				slug: "capabilities/always-on",
			},
			{
				id: "agent-mesh",
				title: "Agent Mesh",
				slug: "capabilities/agent-mesh",
			},
			{ id: "agent-hub", title: "Agent Hub", slug: "capabilities/agent-hub" },
		],
	},
	{
		id: "build",
		title: "Build & automate",
		items: [
			{ id: "exec-mode", title: "Exec mode", slug: "build/exec-mode" },
			{ id: "python-sdk", title: "Python SDK", slug: "build/python-sdk" },
			{
				id: "sse-streaming",
				title: "SSE streaming",
				slug: "build/sse-streaming",
			},
		],
	},
	{
		id: "ecosystem",
		title: "Ecosystem",
		items: [
			{ id: "ecosystem", title: "What's in the ecosystem", slug: "ecosystem" },
		],
	},
	{
		id: "about",
		title: "About",
		items: [
			{ id: "why", title: "Why Local Operator", slug: "about/why" },
			{ id: "faq", title: "FAQ", slug: "about/faq" },
		],
	},
];

/** Every item, in registry order. */
export const NAV_ITEMS: NavItem[] = NAV.flatMap((group) => group.items);

export function navGroupById(id: string): NavGroup | undefined {
	return NAV.find((group) => group.id === id);
}

export function navItemBySlug(slug: string): NavItem | undefined {
	return NAV_ITEMS.find((item) => item.slug === slug);
}

export function navItemById(id: string): NavItem | undefined {
	return NAV_ITEMS.find((item) => item.id === id);
}

/** The href for an item, e.g. `getting-started/install` -> `/getting-started/install`. */
export function navHref(item: NavItem): string {
	return `/${item.slug}`;
}
