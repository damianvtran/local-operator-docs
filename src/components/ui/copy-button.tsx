"use client";

import { Check, ClipboardCopy, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Copy-to-clipboard with tri-state feedback and a live region.
 *
 * The state is announced through `role="status"` (polite) instead of only
 * changing an icon: a screen-reader user pressing the button otherwise gets
 * no confirmation at all. The reset timer is tracked in a ref so unmount or a
 * second press cannot leave a stale "Copied" showing.
 */
type CopyState = "idle" | "copied" | "error";

export function CopyButton({
	value,
	label,
	className,
	ariaLabel = "Copy to clipboard",
}: {
	value: string;
	label?: string;
	className?: string;
	ariaLabel?: string;
}) {
	const [state, setState] = useState<CopyState>("idle");
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, []);

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
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
			aria-label={ariaLabel}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-surface px-2 py-1 font-mono text-mono-sm text-ink-muted transition-colors duration-fast ease-out-quart",
				"hover:border-control hover:text-ink",
				state === "error" && "border-danger-border text-danger",
				className,
			)}
		>
			<Icon className="size-3.5" aria-hidden="true" />
			{label ? <span>{label}</span> : null}
			<span role="status" aria-live="polite" className="sr-only">
				{state === "copied"
					? "Copied to clipboard"
					: state === "error"
						? "Copy failed"
						: ""}
			</span>
		</button>
	);
}
