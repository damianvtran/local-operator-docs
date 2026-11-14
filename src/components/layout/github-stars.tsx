"use client";

import { Star } from "lucide-react";
import { GitHubMark } from "@/components/ui/github-mark";
import { SITE } from "@/lib/site";
import { formatStarCount, starsLabel } from "@/lib/stars";
import { useStarCount } from "@/lib/use-star-count";

/**
 * The top bar's GitHub link, with the repo's star count beside the mark.
 *
 * `initial` is the build-time count (`buildStars()`), so the server HTML
 * already shows a number; the hook may then swap in GitHub's live value. The
 * count is monospace with fixed digit widths, so an in-place refresh
 * (229 → 230) moves nothing in the bar.
 *
 * Narrow screens (< sm) keep the original 36px icon-only button: the bar at
 * ~390px already holds the menu trigger, the wordmark, search, theme and
 * GitHub, and the version chip is hidden there for the same reason. The
 * accessible name carries the full count at every width, so nothing is lost
 * to assistive tech when the number is visually hidden.
 */
export function GitHubStars({ initial }: { initial: number }) {
	const stars = useStarCount(initial);
	const label = starsLabel(stars);

	return (
		<a
			href={SITE.github}
			target="_blank"
			rel="noreferrer"
			aria-label={label}
			title={label}
			/*
			 * `h-9` + `rounded-sm` match the search field and theme button. At sm+
			 * it gains the version chip's hairline border so it reads as the same
			 * family of control as the pill to its left.
			 */
			className="inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-sm text-ink-muted transition-colors duration-fast hover:bg-surface hover:text-ink sm:border sm:border-hairline sm:px-2.5 sm:hover:border-control"
		>
			<GitHubMark className="size-4" />
			<span
				aria-hidden="true"
				className="hidden items-center gap-1 font-mono text-mono-sm tabular-nums sm:inline-flex"
			>
				<Star className="size-3" aria-hidden="true" />
				{formatStarCount(stars)}
			</span>
		</a>
	);
}
