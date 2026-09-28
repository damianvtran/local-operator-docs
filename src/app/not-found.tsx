import Link from "next/link";

/**
 * 404. Deliberately quiet: the site's search is one keystroke away, so the
 * page says what to do instead of apologising.
 */
export default function NotFound() {
	return (
		<div className="mx-auto flex w-full max-w-[96rem] flex-col items-start gap-4 px-4 py-24">
			<p className="font-mono text-mono-sm uppercase tracking-wider text-ink-dim">
				404
			</p>
			<h1 className="text-display text-ink">That page does not exist.</h1>
			<p className="max-w-[52ch] text-body text-ink-muted">
				It may have moved, or it may not be written yet. Press{" "}
				<kbd className="rounded-xs border border-hairline bg-surface px-1.5 py-0.5 font-mono text-mono-sm">
					⌘K
				</kbd>{" "}
				to search, or start from one of these:
			</p>
			<div className="mt-2 flex flex-wrap gap-3">
				<Link
					href="/"
					className="rounded-sm border border-hairline px-3 py-2 text-body-sm text-ink transition-colors duration-fast hover:border-control"
				>
					Home
				</Link>
				<Link
					href="/getting-started/install"
					className="rounded-sm border border-hairline px-3 py-2 text-body-sm text-ink transition-colors duration-fast hover:border-control"
				>
					Install & first run
				</Link>
				<Link
					href="/getting-started/quickstart"
					className="rounded-sm border border-hairline px-3 py-2 text-body-sm text-ink transition-colors duration-fast hover:border-control"
				>
					Quickstart
				</Link>
			</div>
		</div>
	);
}
