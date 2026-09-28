"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { type SidebarGroup, SidebarNav } from "./sidebar";

/**
 * Mobile navigation: a left sheet with the same nav data as the sidebar.
 *
 * Radix Dialog supplies the focus trap and escape handling; closing on route
 * change is explicit because a link click is not a Dialog close by default.
 * The trigger is labelled (icon buttons need names) and hidden at lg, where
 * the persistent sidebar takes over.
 */
export function MobileNav({ groups }: { groups: SidebarGroup[] }) {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();
	const triggerRef = useRef<HTMLButtonElement>(null);

	// Close on navigation.
	// biome-ignore lint/correctness/useExhaustiveDependencies: closing on pathname change is the point
	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<button
				ref={triggerRef}
				type="button"
				onClick={() => setOpen(true)}
				aria-label="Open navigation"
				className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted transition-colors duration-fast hover:bg-surface hover:text-ink lg:hidden"
			>
				<Menu className="size-4" aria-hidden="true" />
			</button>
			<DialogContent
				className="left-0 top-0 h-dvh max-w-[18rem] translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 bg-canvas p-4"
				aria-describedby={undefined}
				onCloseAutoFocus={(event) => {
					// Radix restores focus to a DialogTrigger; this sheet's trigger is
					// the hamburger the component owns, so hand it back directly —
					// without this, close dropped focus to <body> (UX round 1, U5).
					event.preventDefault();
					triggerRef.current?.focus();
				}}
			>
				<div className="mb-4 flex items-center justify-between">
					<DialogTitle className="text-heading text-ink">
						Navigation
					</DialogTitle>
					<button
						type="button"
						onClick={() => setOpen(false)}
						aria-label="Close navigation"
						className="inline-flex size-8 items-center justify-center rounded-sm text-ink-muted hover:bg-surface hover:text-ink"
					>
						<X className="size-4" aria-hidden="true" />
					</button>
				</div>
				<div className="max-h-[calc(100dvh-6rem)] overflow-y-auto">
					<SidebarNav groups={groups} pathname={pathname} />
				</div>
			</DialogContent>
		</Dialog>
	);
}
