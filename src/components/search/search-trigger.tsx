"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Kbd } from "@/components/ui/kbd";
import { useSearch } from "./search-provider";

/**
 * The search trigger. Two shapes: a labelled button with the shortcut hint on
 * desktop, an icon-only button on small screens (the icon button carries an
 * aria-label; a bare magnifier with no name is not a control).
 *
 * The hint is written as ⌘K for Apple platforms and Ctrl K elsewhere, and it
 * is computed AFTER mount — rendering a platform-dependent string during SSR
 * would mismatch hydration.
 *
 * Both shapes carry `data-search-trigger`: the palette and shortcuts overlays
 * fall back to the visible one when they close without an opener to return
 * focus to (a ⌘K (or `?`) chain that started with focus on <body> — QA
 * round 2, Q3).
 */
export function SearchTrigger() {
	const { openPalette } = useSearch();
	const [hint, setHint] = useState("⌘K");

	useEffect(() => {
		const nav = navigator as Navigator & {
			userAgentData?: { platform?: string };
		};
		const platform = nav.userAgentData?.platform ?? navigator.platform ?? "";
		if (!/mac|iphone|ipad/i.test(platform)) setHint("Ctrl K");
	}, []);

	return (
		<>
			<button
				type="button"
				data-search-trigger
				onClick={openPalette}
				className="hidden h-9 w-56 items-center gap-2 rounded-sm border border-hairline bg-surface px-3 text-body-sm text-ink-dim transition-colors duration-fast ease-out-quart hover:border-control hover:text-ink sm:flex"
				aria-label="Search docs"
			>
				<Search className="size-3.5" aria-hidden="true" />
				<span>Search</span>
				{/*
				 * The cap keeps the page ground (`bg-canvas`), the one documented
				 * difference from the shared style: this field is the site's only
				 * filled control, and a cap recessed into it reads as a key where a
				 * same-ground cap would read as loose text.
				 */}
				<Kbd className="ml-auto bg-canvas">{hint}</Kbd>
			</button>
			<button
				type="button"
				data-search-trigger
				onClick={openPalette}
				aria-label="Search docs"
				className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted transition-colors duration-fast hover:bg-surface hover:text-ink sm:hidden"
			>
				<Search className="size-4" aria-hidden="true" />
			</button>
		</>
	);
}
