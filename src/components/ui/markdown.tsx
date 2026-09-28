import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScrollRegion } from "./scroll-region";

/**
 * The Markdown element set.
 *
 * Every content route is a Markdoc render of one .md file, so THIS FILE is
 * the styling surface for the whole docs property. Elements sit in the
 * article's single reading column — no component may introduce a second
 * measure; overflow scrolls inside the column (`ScrollRegion`) — see
 * `.docs-article` in globals.css.
 *
 * Colours are roles (`text-ink-muted`), never hexes; the design-system check
 * enforces that boundary.
 */

type HeadingProps = {
	children?: ReactNode;
	id?: string;
};

/**
 * The `#` affordance in the measure track's left margin: a real focusable
 * <a>, never a ::before, so it is keyboard reachable; hidden by opacity (not
 * display) so it can hold focus while invisible — see `.lo-heading-anchor`.
 *
 * It is a SIBLING of the heading element inside a positioned wrapper, not a
 * child of it, and that is an accessibility decision: a focusable link
 * inside the <h2> becomes part of the heading's accessible name, which made
 * every heading announce as "Link to this section Terminal runtime". The
 * wrapper keeps the anchor focusable while the name stays exactly the text.
 */
function HeadingAnchor({ id }: { id: string }) {
	return (
		<a
			href={`#${id}`}
			className="lo-heading-anchor"
			aria-label="Link to this section"
		>
			#
		</a>
	);
}

function HeadingShell({
	level,
	id,
	className,
	children,
}: {
	level: 1 | 2 | 3 | 4;
	id?: string;
	className?: string;
	children?: ReactNode;
}) {
	const Tag = `h${level}` as const;
	return (
		<div className="lo-heading" data-level={level}>
			{id && level !== 1 ? <HeadingAnchor id={id} /> : null}
			<Tag id={id} className={className}>
				{children}
			</Tag>
		</div>
	);
}

export function MarkdownH1({ children, id }: HeadingProps) {
	return (
		<HeadingShell level={1} id={id} className="text-display text-ink">
			{children}
		</HeadingShell>
	);
}

export function MarkdownH2({ children, id }: HeadingProps) {
	return (
		<HeadingShell
			level={2}
			id={id}
			className="border-b border-hairline pb-3 text-title text-ink"
		>
			{children}
		</HeadingShell>
	);
}

export function MarkdownH3({ children, id }: HeadingProps) {
	return (
		<HeadingShell level={3} id={id} className="text-heading text-ink">
			{children}
		</HeadingShell>
	);
}

export function MarkdownH4({ children, id }: HeadingProps) {
	return (
		<HeadingShell level={4} id={id} className="text-heading text-ink-muted">
			{children}
		</HeadingShell>
	);
}

export function MarkdownP({ children }: { children: ReactNode }) {
	return <p className="text-body text-ink-muted">{children}</p>;
}

export function MarkdownBlockquote({ children }: { children: ReactNode }) {
	// A rule, not a container: a filled, italic box reads as a callout and
	// competes with the real callout components.
	return (
		<blockquote className="border-l-2 border-accent pl-4 text-ink-muted">
			{children}
		</blockquote>
	);
}

export function MarkdownList({
	children,
	isOrdered,
}: {
	children: ReactNode;
	isOrdered?: boolean;
}) {
	const shared =
		"ml-6 list-outside space-y-1.5 text-body text-ink-muted marker:text-ink-dim";
	const nesting = "[&_ul]:mt-2 [&_ul]:ml-6 [&_ol]:mt-2 [&_ol]:ml-6";
	if (isOrdered) {
		return (
			<ol
				className={cn(
					shared,
					nesting,
					"list-decimal marker:font-mono marker:text-body-sm",
				)}
			>
				{children}
			</ol>
		);
	}
	return (
		<ul className={cn(shared, nesting, "list-disc [&_ul]:list-[circle]")}>
			{children}
		</ul>
	);
}

export function MarkdownListItem({ children }: { children: ReactNode }) {
	return <li>{children}</li>;
}

export function MarkdownCode({ children }: { children: ReactNode }) {
	// An inline code span is usually the operative noun of its sentence, so it
	// is brighter than the prose around it; `overflow-wrap` keeps long paths
	// inside the measure.
	return (
		<code className="rounded-xs bg-surface px-[5px] py-[2px] font-mono text-mono text-ink [overflow-wrap:anywhere]">
			{children}
		</code>
	);
}

export function MarkdownHr() {
	return <hr className="border-hairline" />;
}

const isExternal = (href: string) => /^https?:\/\//.test(href);

export function MarkdownLink({
	href,
	children,
}: {
	href: string;
	children: ReactNode;
}) {
	if (isExternal(href)) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noreferrer"
				className="text-ink underline decoration-hairline underline-offset-2 transition-colors duration-fast hover:decoration-accent"
			>
				{children}
				<ArrowUpRight
					className="ml-0.5 inline size-3.5 text-ink-dim"
					aria-hidden="true"
				/>
			</a>
		);
	}
	return (
		<Link
			href={href}
			className="text-ink underline decoration-hairline underline-offset-2 transition-colors duration-fast hover:decoration-accent"
		>
			{children}
		</Link>
	);
}

export function MarkdownEmphasis({ children }: { children: ReactNode }) {
	return <em>{children}</em>;
}

export function MarkdownStrong({ children }: { children: ReactNode }) {
	return <strong className="font-semibold text-ink">{children}</strong>;
}

export function MarkdownTable({
	children,
	section,
}: {
	children: ReactNode;
	section?: string;
} & HTMLAttributes<HTMLTableElement>) {
	// The first column is the row's key (a flag, a path, a setting) and must
	// keep a min-content floor of its longest token. Inline code carries
	// `overflow-wrap:anywhere` (which removes that floor), and in a squeezing
	// auto-layout table it broke tokens mid-word at 390px instead of letting
	// ScrollRegion scroll: `--resume [SESSION_ID]` came out across five lines
	// (QA round 1, Q2). The key column is nowrap; wide keys push the table
	// into the region's horizontal scroll, which is what it exists for.
	return (
		<ScrollRegion label={section ? `Table: ${section}` : "Table"}>
			<table className="w-full border-collapse text-body-sm">{children}</table>
		</ScrollRegion>
	);
}

export function MarkdownTableHead({ children }: { children: ReactNode }) {
	return (
		<thead
			className={cn(
				"[&_th]:bg-surface [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:align-top [&_th]:font-mono [&_th]:text-mono-sm [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-ink-dim",
				"[&_th:first-child]:whitespace-nowrap",
				"[&_tr]:border-b [&_tr]:border-control",
			)}
		>
			{children}
		</thead>
	);
}

export function MarkdownTableBody({ children }: { children: ReactNode }) {
	return (
		<tbody
			className={cn(
				"[&_tr]:border-b [&_tr]:border-hairline [&_tr:last-child]:border-0 [&_tr:hover]:bg-surface",
				"[&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:text-ink-muted",
				"[&_td:first-child]:whitespace-nowrap",
				"[&_tr]:transition-colors [&_tr]:duration-fast",
			)}
		>
			{children}
		</tbody>
	);
}

export function MarkdownTableRow({ children }: { children: ReactNode }) {
	return <tr>{children}</tr>;
}

export function MarkdownTableCell({
	children,
	isHeader,
}: {
	children?: ReactNode;
	isHeader?: boolean;
}) {
	const Cell = isHeader ? "th" : "td";
	// The first column is usually the row's key (a flag, a path): mono.
	return <Cell className={cn(isHeader && "text-left")}>{children}</Cell>;
}

/** Map used by markdoc-config; names match the `render:` strings. */
export const markdownComponents = {
	Heading: function Heading({
		level,
		id,
		children,
	}: {
		level: number;
		id?: string;
		children?: ReactNode;
	}) {
		if (level === 1) return <MarkdownH1 id={id}>{children}</MarkdownH1>;
		if (level === 2) return <MarkdownH2 id={id}>{children}</MarkdownH2>;
		if (level === 3) return <MarkdownH3 id={id}>{children}</MarkdownH3>;
		return <MarkdownH4 id={id}>{children}</MarkdownH4>;
	},
	Paragraph: MarkdownP,
	Blockquote: MarkdownBlockquote,
	List: MarkdownList,
	ListItem: MarkdownListItem,
	Code: MarkdownCode,
	Hr: MarkdownHr,
	Link: MarkdownLink,
	Emphasis: MarkdownEmphasis,
	Strong: MarkdownStrong,
	Table: MarkdownTable,
	TableHead: MarkdownTableHead,
	TableBody: MarkdownTableBody,
	TableRow: MarkdownTableRow,
	TableCell: MarkdownTableCell,
};

export type { AnchorHTMLAttributes };
