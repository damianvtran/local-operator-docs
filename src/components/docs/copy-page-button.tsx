"use client";

import { Check, ClipboardCopy, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * "Copy page": hands the reader the page's raw markdown (the same source
 * `/raw/<slug>` serves to agents), so a page can be pasted into a prompt or a
 * sibling repo without scraping HTML.
 */
export function CopyPageButton({ slug }: { slug: string }) {
	const [state, setState] = useState<"idle" | "copied" | "error">("idle");
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, []);

	async function copy() {
		try {
			const response = await fetch(`/raw/${slug}`);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const markdown = await response.text();
			await navigator.clipboard.writeText(markdown);
			setState("copied");
		} catch {
			setState("error");
		}
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setState("idle"), 2000);
	}

	const Icon =
		state === "copied"
			? Check
			: state === "error"
				? TriangleAlert
				: ClipboardCopy;

	return (
		<button
			type="button"
			onClick={copy}
			className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-hairline bg-surface px-2.5 py-1.5 font-mono text-mono-sm text-ink-muted transition-colors duration-fast ease-out-quart hover:border-control hover:text-ink"
		>
			<Icon className="size-3.5" aria-hidden="true" />
			{state === "copied"
				? "Copied"
				: state === "error"
					? "Copy failed"
					: "Copy page"}
			<span role="status" aria-live="polite" className="sr-only">
				{state === "copied"
					? "Page markdown copied"
					: state === "error"
						? "Copy failed"
						: ""}
			</span>
		</button>
	);
}
