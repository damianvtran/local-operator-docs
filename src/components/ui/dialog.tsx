"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Dialog, wrapped over the unified `radix-ui` package.
 *
 * Radix supplies what a hand-rolled overlay gets wrong: focus trap, focus
 * restore, scroll lock, escape handling, aria-modal wiring. The styling is
 * ours: scrim role for the overlay, elevated + one shadow for the surface
 * (this IS an out-of-flow object, so the single overlay shadow is correct
 * here and only here).
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({
	className,
	children,
	overlayClassName,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	overlayClassName?: string;
}) {
	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay
				className={cn(
					"lo-overlay fixed inset-0 z-50 bg-scrim",
					overlayClassName,
				)}
			/>
			<DialogPrimitive.Content
				className={cn(
					"lo-dialog fixed left-1/2 top-[10vh] z-50 w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2",
					"rounded-lg border border-hairline bg-elevated text-ink shadow-overlay",
					className,
				)}
				{...props}
			>
				{children}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}
