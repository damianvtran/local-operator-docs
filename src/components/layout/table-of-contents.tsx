"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/headings";
import { cn } from "@/lib/utils";

/**
 * The right-hand table of contents with scrollspy.
 *
 * The observer is rooted at the viewport (the document is the scrollport in
 * this layout) with a bottom margin that makes the "current" heading the top
 * one that has crossed the upper third — the radient-docs tuning, kept
 * because it behaves the way readers expect while scrolling fast. h2/h3 only:
 * the TOC is a wayfinding device, not a document outline.
 */
export function TableOfContents({ entries }: { entries: TocEntry[] }) {
	const [activeId, setActiveId] = useState<string | null>(
		entries[0]?.id ?? null,
	);

	useEffect(() => {
		if (entries.length === 0) return;
		const headings = entries
			.map((entry) => document.getElementById(entry.id))
			.filter((element): element is HTMLElement => element !== null);
		if (headings.length === 0) return;

		const observer = new IntersectionObserver(
			(records) => {
				const visible = records
					.filter((record) => record.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible.length > 0) {
					setActiveId(visible[0].target.id);
				}
			},
			{ root: null, rootMargin: "0px 0px -70% 0px", threshold: 0 },
		);

		for (const heading of headings) observer.observe(heading);
		return () => observer.disconnect();
	}, [entries]);

	if (entries.length === 0) return null;

	return (
		<nav
			aria-label="On this page"
			className="sticky top-[calc(var(--header-height)_+_2rem)] hidden max-h-[calc(100dvh_-_var(--header-height)_-_4rem)] w-[var(--container-toc)] shrink-0 self-start overflow-y-auto pb-10 xl:block"
		>
			<h2 className="mb-2 text-meta font-semibold uppercase tracking-wider text-ink-dim">
				On this page
			</h2>
			<ul className="space-y-0.5 border-l border-hairline">
				{entries.map((entry) => {
					const active = entry.id === activeId;
					return (
						<li key={entry.id}>
							<a
								href={`#${entry.id}`}
								aria-current={active ? "location" : undefined}
								className={cn(
									"block border-l-2 py-1 pr-2 text-body-sm transition-colors duration-fast ease-out-quart",
									entry.level === 3 ? "pl-6" : "pl-3",
									active
										? "-ml-px border-accent text-ink"
										: "-ml-px border-transparent text-ink-dim hover:text-ink",
								)}
							>
								{entry.text}
							</a>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
