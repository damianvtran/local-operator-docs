import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ResolvedItem } from "@/lib/content";

/**
 * Previous / next footer navigation, derived from the published pages in
 * registry order — not from the sidebar's DOM, and not hand-maintained.
 * Drafts and planned pages never appear here.
 */
export function Pager({
	prev,
	next,
}: {
	prev?: ResolvedItem;
	next?: ResolvedItem;
}) {
	if (!prev && !next) return null;
	return (
		<nav
			aria-label="Pagination"
			className="mt-16 grid gap-4 border-t border-hairline pt-6 sm:grid-cols-2"
		>
			{prev ? (
				<Link
					href={prev.href}
					className="group flex flex-col gap-1 rounded-md border border-hairline p-4 transition-colors duration-fast ease-out-quart hover:border-control"
				>
					<span className="flex items-center gap-1 text-meta text-ink-dim">
						<ChevronLeft className="size-3.5" aria-hidden="true" /> Previous
					</span>
					<span className="text-body text-ink">
						{prev.page?.title ?? prev.title}
					</span>
				</Link>
			) : (
				<span />
			)}
			{next ? (
				<Link
					href={next.href}
					className="group flex flex-col gap-1 rounded-md border border-hairline p-4 text-right transition-colors duration-fast ease-out-quart hover:border-control sm:items-end"
				>
					<span className="flex items-center gap-1 text-meta text-ink-dim">
						Next <ChevronRight className="size-3.5" aria-hidden="true" />
					</span>
					<span className="text-body text-ink">
						{next.page?.title ?? next.title}
					</span>
				</Link>
			) : (
				<span />
			)}
		</nav>
	);
}
