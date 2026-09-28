import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Columns and Column: a two-up prose layout for short parallel content
 * (a "good first tasks" / "where things live" pairing, for example). Not a
 * grid system — if content needs three columns it needs a table or cards.
 */
export function Columns({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("grid gap-6 sm:grid-cols-2", className)}>{children}</div>
	);
}

export function Column({
	children,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className="min-w-0 text-body text-ink-muted [&>:first-child]:mt-0">
			{children}
		</div>
	);
}
