"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tabs, wrapped over the unified `radix-ui` package.
 *
 * Radix gives keyboard behaviour for free (arrows within the list, roving
 * tabindex, aria-controls/selected wiring). Used by Markdoc's {% raw %}tabs/
 * tab{% endraw %} tags; it remembers nothing across pages by design — the
 * "remembers selection" behaviour lives in the markdoc tab component, not
 * here.
 */
export const Tabs = TabsPrimitive.Root;

export function TabsList({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			className={cn(
				"flex items-center gap-1 border-b border-hairline",
				className,
			)}
			{...props}
		/>
	);
}

export function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				"-mb-px inline-flex h-9 items-center rounded-t-sm border-b-2 border-transparent px-3 text-body-sm text-ink-muted transition-colors duration-fast ease-out-quart",
				"hover:text-ink",
				"data-[state=active]:border-accent data-[state=active]:text-ink",
				className,
			)}
			{...props}
		/>
	);
}

export function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return <TabsPrimitive.Content className={cn("pt-4", className)} {...props} />;
}
