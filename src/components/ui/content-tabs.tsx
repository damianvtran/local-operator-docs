"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

/**
 * Markdoc `{% tabs %}` / `{% tab %}`.
 *
 * Client component because the selection must remember across visits (the
 * brief's requirement) — the panels themselves are server-rendered children
 * handed through as props, so no content ships twice. The storage key is the
 * label set, which keeps "macOS | Linux | Windows" consistent between pages
 * that use the same grouping.
 */
const STORAGE_PREFIX = "lop-docs:tabs:";

export function ContentTabs({
	labels,
	children,
}: {
	labels: string[];
	children?: ReactNode;
}) {
	const items = Array.isArray(children) ? children : [children];
	const storageKey = `${STORAGE_PREFIX}${labels.join("|")}`;
	const [value, setValue] = useState(labels[0]);

	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(storageKey);
			if (stored && labels.includes(stored)) setValue(stored);
		} catch {
			// Private-mode storage failures are not worth breaking a tab over.
		}
	}, [storageKey, labels]);

	function change(next: string) {
		setValue(next);
		try {
			window.localStorage.setItem(storageKey, next);
		} catch {
			// Same: persistence is an enhancement, not the feature.
		}
	}

	return (
		<Tabs value={value} onValueChange={change}>
			<TabsList aria-label="Options">
				{labels.map((label) => (
					<TabsTrigger key={label} value={label}>
						{label}
					</TabsTrigger>
				))}
			</TabsList>
			{labels.map((label, index) => (
				<TabsContent key={label} value={label}>
					{items[index]}
				</TabsContent>
			))}
		</Tabs>
	);
}
