"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A horizontally scrollable region that only becomes a tab stop when it
 * actually scrolls.
 *
 * WCAG requires scrollable regions to be keyboard-reachable; the naive
 * `tabIndex={0}` on every table adds a dead stop on every non-overflowing
 * one (radient-docs shipped exactly that: seven dead tab stops announcing
 * scrollability that was not there). Measuring real overflow fixes both
 * directions.
 */
export function ScrollRegion({
	children,
	label,
	className,
}: {
	children: ReactNode;
	label: string;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [overflows, setOverflows] = useState(false);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		const measure = () =>
			setOverflows(element.scrollWidth > element.clientWidth + 1);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			className={cn("lo-bleed overflow-x-auto", className)}
			{...(overflows
				? { role: "region", tabIndex: 0, "aria-label": label }
				: {})}
		>
			{children}
		</div>
	);
}
