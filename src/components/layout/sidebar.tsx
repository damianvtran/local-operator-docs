"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The docs sidebar nav.
 *
 * The group/item data is passed in from the server (derived from the nav
 * registry x content), so this component owns only presentation: collapsible
 * groups, active-route highlighting, and nothing else. A hardcoded list here
 * is the drift this build exists to prevent.
 */
export type SidebarItem = { id: string; title: string; href: string };
export type SidebarGroup = { id: string; title: string; items: SidebarItem[] };

function Group({ group, pathname }: { group: SidebarGroup; pathname: string }) {
	const [open, setOpen] = useState(true);
	const contentId = `nav-group-${group.id}`;

	return (
		<div>
			<h3>
				<button
					type="button"
					onClick={() => setOpen((value) => !value)}
					aria-expanded={open}
					aria-controls={contentId}
					className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-meta font-semibold uppercase tracking-wider text-ink-dim transition-colors duration-fast hover:text-ink"
				>
					{group.title}
					<ChevronDown
						className={cn(
							"size-3.5 transition-transform duration-fast",
							!open && "-rotate-90",
						)}
						aria-hidden="true"
					/>
				</button>
			</h3>
			<ul id={contentId} className={cn("mt-1 space-y-0.5", !open && "hidden")}>
				{group.items.map((item) => {
					const active =
						pathname === item.href || pathname.startsWith(`${item.href}/`);
					return (
						<li key={item.id}>
							<Link
								href={item.href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"block rounded-sm border-l-2 py-1.5 pl-3 pr-2 text-body-sm transition-colors duration-fast ease-out-quart",
									active
										? "border-accent bg-surface font-medium text-ink"
										: "border-transparent text-ink-muted hover:bg-surface hover:text-ink",
								)}
							>
								{item.title}
							</Link>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export function SidebarNav({
	groups,
	pathname,
}: {
	groups: SidebarGroup[];
	pathname: string;
}) {
	return (
		<nav aria-label="Docs" className="flex flex-col gap-4">
			{groups.map((group) => (
				<Group key={group.id} group={group} pathname={pathname} />
			))}
		</nav>
	);
}

/** Pathname-aware wrapper for use inside client components. */
export function SidebarNavAuto({ groups }: { groups: SidebarGroup[] }) {
	const pathname = usePathname();
	return <SidebarNav groups={groups} pathname={pathname} />;
}
