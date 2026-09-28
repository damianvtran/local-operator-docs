import Link from "next/link";

/**
 * Breadcrumbs: Docs / Group / Page.
 *
 * The group title is text, not a link — groups have no landing pages, and a
 * breadcrumb that links nowhere is worse than one that simply names where
 * you are.
 */
export function Breadcrumbs({
	group,
	title,
}: {
	group?: string;
	title?: string;
}) {
	return (
		<nav aria-label="Breadcrumb" className="min-w-0 text-body-sm text-ink-dim">
			<ol className="flex flex-wrap items-center gap-2">
				<li>
					<Link
						href="/"
						className="transition-colors duration-fast hover:text-ink"
					>
						Docs
					</Link>
				</li>
				{group ? (
					<>
						<li aria-hidden="true">/</li>
						<li>{group}</li>
					</>
				) : null}
				{title ? (
					<>
						<li aria-hidden="true">/</li>
						<li className="truncate text-ink" aria-current="page">
							{title}
						</li>
					</>
				) : null}
			</ol>
		</nav>
	);
}
