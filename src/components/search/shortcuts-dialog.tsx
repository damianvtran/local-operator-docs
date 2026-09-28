"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { CHORD_LIST } from "./chords";

/**
 * The `?` overlay: every global key in one place.
 *
 * Documented keys and implemented keys come from the same sources (CHORD_LIST
 * for navigation, a literal table for the palette keys), so this overlay is a
 * reference, not marketing copy.
 */
const GLOBAL_KEYS: Array<[keys: string, what: string]> = [
	["⌘K / Ctrl K", "Open or close search"],
	["/", "Open search"],
	["?", "This overlay"],
];

const PALETTE_KEYS: Array<[keys: string, what: string]> = [
	["↑ ↓", "Move through results"],
	["Tab", "Jump to the next group"],
	["↵", "Open the selected result"],
	["Esc", "Close the palette"],
];

function Row({ keys, what }: { keys: string; what: string }) {
	return (
		<div className="flex items-baseline justify-between gap-4 py-1.5">
			<span className="text-body-sm text-ink-muted">{what}</span>
			<span className="flex shrink-0 gap-1">
				{keys.split(" / ").map((key) => (
					<Kbd key={key}>{key}</Kbd>
				))}
			</span>
		</div>
	);
}

export function ShortcutsDialog({
	open,
	onOpenChange,
	returnFocus,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** The control the overlay was opened from, restored on close — Radix
	 *  only restores focus for a DialogTrigger, and this one has none
	 *  (UX round 1, U5). */
	returnFocus: () => HTMLElement | null;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				aria-describedby={undefined}
				onCloseAutoFocus={(event) => {
					const target = returnFocus();
					if (target?.isConnected) {
						event.preventDefault();
						target.focus();
					}
				}}
			>
				<div className="border-b border-hairline px-4 py-3">
					<DialogTitle className="text-heading text-ink">
						Keyboard shortcuts
					</DialogTitle>
					<DialogDescription className="text-body-sm text-ink-muted">
						Everything below works anywhere on the site.
					</DialogDescription>
				</div>
				<div className="grid gap-6 p-4 sm:grid-cols-2">
					<section aria-label="Global shortcuts">
						<h3 className="mb-2 text-meta font-semibold uppercase tracking-wider text-ink-dim">
							Global
						</h3>
						{GLOBAL_KEYS.map(([keys, what]) => (
							<Row key={keys} keys={keys} what={what} />
						))}
						<h3 className="mb-2 mt-4 text-meta font-semibold uppercase tracking-wider text-ink-dim">
							In the palette
						</h3>
						{PALETTE_KEYS.map(([keys, what]) => (
							<Row key={keys} keys={keys} what={what} />
						))}
					</section>
					<section aria-label="Navigation chords">
						<h3 className="mb-2 text-meta font-semibold uppercase tracking-wider text-ink-dim">
							Go to <span className="normal-case">(press g, then…)</span>
						</h3>
						{CHORD_LIST.map(({ key, label }) => (
							<Row key={key} keys={`g ${key}`} what={label} />
						))}
					</section>
				</div>
			</DialogContent>
		</Dialog>
	);
}
