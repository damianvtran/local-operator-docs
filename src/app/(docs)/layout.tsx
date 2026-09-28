import type { ReactNode } from "react";
import { SidebarNavAuto } from "@/components/layout/sidebar";
import { getSidebarNav } from "@/lib/content";

/**
 * The docs shell: a persistent left sidebar and the content column.
 *
 * Lives on the (docs) route group, not the root layout, because the home page
 * is a full-width marketing surface — the shell is for reading pages.
 * Document scroll (not a nested scrollport) is deliberate: anchor links,
 * scroll restoration and the mobile URL bar all behave natively, and the
 * sidebar pins itself with `position: sticky`.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
	const groups = getSidebarNav().map((group) => ({
		id: group.id,
		title: group.title,
		items: group.items.map((item) => ({
			id: item.id,
			title: item.title,
			href: item.href,
		})),
	}));

	return (
		<div className="mx-auto grid w-full max-w-[96rem] grid-cols-1 gap-8 px-4 lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
			<aside className="hidden lg:block">
				<div className="sticky top-[calc(var(--header-height)_+_1rem)] max-h-[calc(100dvh_-_var(--header-height)_-_2rem)] overflow-y-auto pb-10 pr-2">
					<SidebarNavAuto groups={groups} />
				</div>
			</aside>
			<div className="min-w-0 pt-10">{children}</div>
		</div>
	);
}
