import {
	CircleAlert,
	Info,
	Lightbulb,
	type LucideIcon,
	TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Callouts.
 *
 * Each variant uses its semantic triple (border / wash / icon) from the
 * palette — the same triples the app uses for status — so a warning callout
 * is the product's warning colour, not a hand-picked amber. `danger` exists
 * for real footguns only; a note is not a danger.
 */
const VARIANTS: Record<
	string,
	{ icon: LucideIcon; className: string; label: string }
> = {
	note: {
		icon: Info,
		className: "border-info-border bg-info-wash",
		label: "Note",
	},
	tip: {
		icon: Lightbulb,
		className: "border-success-border bg-success-wash",
		label: "Tip",
	},
	warning: {
		icon: TriangleAlert,
		className: "border-warning-border bg-warning-wash",
		label: "Warning",
	},
	danger: {
		icon: CircleAlert,
		className: "border-danger-border bg-danger-wash",
		label: "Danger",
	},
};

export function Callout({
	type = "note",
	children,
}: {
	type?: string;
	children: ReactNode;
}) {
	const variant = VARIANTS[type] ?? VARIANTS.note;
	const Icon = variant.icon;
	return (
		<div className={cn("flex gap-3 rounded-md border p-4", variant.className)}>
			<Icon className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden="true" />
			<div className="min-w-0 text-body text-ink-muted [&_a]:text-ink [&_code]:bg-surface [&_p]:text-ink-muted">
				<span className="sr-only">{variant.label}: </span>
				{children}
			</div>
		</div>
	);
}
