import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Steps and Step.
 *
 * A steps block is an ordered list where the number is the affordance: the
 * marker is drawn by a CSS counter in globals.css (`.lo-steps`) so every step
 * gets its number without the renderer knowing its index — Markdoc renders
 * each Step in isolation, and a component that cannot see its position must
 * not fake one.
 */
export function Steps({ children }: { children: ReactNode }) {
	return <ol className="lo-steps lo-bleed space-y-6">{children}</ol>;
}

export function Step({
	title,
	children,
}: {
	title?: string;
	children: ReactNode;
}) {
	return (
		<li className={cn("relative", "[&_p:last-child]:mb-0")}>
			{title ? <p className="mb-1 text-heading text-ink">{title}</p> : null}
			<div className="text-body text-ink-muted [&_p]:text-ink-muted">
				{children}
			</div>
		</li>
	);
}
