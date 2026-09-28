"use client";

import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Dropdown menu, wrapped over the unified `radix-ui` package.
 *
 * The content surface is `elevated` with the single overlay shadow — the same
 * out-of-flow treatment as the dialog. Items highlight with a colour step
 * (`surface` wash under the pointer), never a lift.
 */
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export function DropdownMenuContent({
	className,
	sideOffset = 6,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				sideOffset={sideOffset}
				className={cn(
					"lo-dialog z-50 min-w-[10rem] overflow-hidden rounded-md border border-hairline bg-elevated p-1 text-ink shadow-overlay",
					className,
				)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}

export function DropdownMenuItem({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
	return (
		<DropdownMenuPrimitive.Item
			className={cn(
				"flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-body-sm text-ink",
				"data-[highlighted]:bg-surface data-[disabled]:text-ink-disabled",
				"[&_svg]:size-4 [&_svg]:text-ink-muted",
				className,
			)}
			{...props}
		/>
	);
}

export function DropdownMenuSeparator({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
	return (
		<DropdownMenuPrimitive.Separator
			className={cn("-mx-1 my-1 h-px bg-hairline", className)}
			{...props}
		/>
	);
}
