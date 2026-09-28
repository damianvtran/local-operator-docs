import { type ReactNode, useId } from "react";

/**
 * The shared drawing grammar for the docs diagrams.
 *
 * Why a grammar and not eleven self-contained SVGs: the diagrams sit beside
 * each other across the site, so they have to read as siblings — the same
 * radii, the same arrowheads, the same ink roles. Every colour-bearing piece
 * reads Tailwind role utilities (`fill-elevated`, `stroke-hairline`,
 * `text-ink-muted`) which resolve through the palette variables per theme;
 * nothing here may write a raw value — `scripts/check-design-system.mjs`
 * fails the lint/build on hexes and stock Tailwind palette classes.
 *
 * Geometry is SVG user units on a 720-wide viewBox. Text uses the site's type
 * roles (13/12px) so a diagram scaled to its container keeps the page's
 * typographic scale instead of inventing one.
 */

/** The site's radius scale; SVG needs numbers, not the CSS variables. */
export const RADIUS = { xs: 2, sm: 6, md: 10 } as const;

/** Props every diagram component takes; the frame supplies the strings. */
export type DiagramProps = {
	/** Human title, rendered as the SVG's <title>. */
	title: string;
	/** Long description, rendered as the SVG's <desc>. */
	description: string;
};

/**
 * The SVG shell: viewBox, responsive sizing, and the accessibility wiring.
 *
 * `role="img"` plus <title>/<desc> is the SVG-native way to give a diagram a
 * name and a description; aria-labelledby/describedby point at the same nodes
 * so the mapping is explicit rather than assumed. Use `useId` per instance:
 * two diagrams can share one page, and the ids must not collide.
 */
export function DiagramSvg({
	viewBox,
	title,
	description,
	children,
}: DiagramProps & { viewBox: string; children: ReactNode }) {
	const id = useId();
	const titleId = `${id}title`;
	const descId = `${id}desc`;
	return (
		<svg
			viewBox={viewBox}
			className="h-auto w-full"
			role="img"
			aria-labelledby={titleId}
			aria-describedby={descId}
			focusable="false"
		>
			<title id={titleId}>{title}</title>
			<desc id={descId}>{description}</desc>
			{children}
		</svg>
	);
}

/**
 * A straight connector with programmatically drawn arrowheads.
 *
 * Heads are polygons rather than SVG markers on purpose: markers need
 * document-global ids (two diagrams on one page would race for them) and
 * `context-stroke` support is not uniform. The math trims the line back
 * behind each head so the stroke cannot poke through the tip.
 */
export function Arrow({
	from,
	to,
	className = "text-ink-muted",
	heads = "end",
	dashed = false,
}: {
	from: [number, number];
	to: [number, number];
	className?: string;
	heads?: "end" | "both" | "none";
	dashed?: boolean;
}) {
	const [x1, y1] = from;
	const [x2, y2] = to;
	const dx = x2 - x1;
	const dy = y2 - y1;
	const len = Math.hypot(dx, dy) || 1;
	const ux = dx / len;
	const uy = dy / len;
	const head = 9;
	const trim = heads === "none" ? 0 : head - 1;
	const sx = heads === "both" ? x1 + trim * ux : x1;
	const sy = heads === "both" ? y1 + trim * uy : y1;
	const ex = heads === "none" ? x2 : x2 - trim * ux;
	const ey = heads === "none" ? y2 : y2 - trim * uy;
	const tip = (tx: number, ty: number, dirX: number, dirY: number) => {
		const px = -dirY;
		const py = dirX;
		const w = 4.5;
		const bx = tx - dirX * head;
		const by = ty - dirY * head;
		return `${tx},${ty} ${bx + px * w},${by + py * w} ${bx - px * w},${by - py * w}`;
	};
	return (
		<g className={className}>
			<line
				x1={sx}
				y1={sy}
				x2={ex}
				y2={ey}
				stroke="currentColor"
				strokeWidth={1.5}
				strokeDasharray={dashed ? "3 4" : undefined}
			/>
			{heads !== "none" ? (
				<polygon points={tip(x2, y2, ux, uy)} fill="currentColor" />
			) : null}
			{heads === "both" ? (
				<polygon points={tip(x1, y1, -ux, -uy)} fill="currentColor" />
			) : null}
		</g>
	);
}

/** A text run. `middle` centres on the baseline for use inside shapes. */
export function Txt({
	x,
	y,
	className = "fill-ink text-body-sm",
	anchor = "start",
	middle = false,
	children,
}: {
	x: number;
	y: number;
	className?: string;
	anchor?: "start" | "middle" | "end";
	middle?: boolean;
	children: ReactNode;
}) {
	return (
		<text
			x={x}
			y={y}
			textAnchor={anchor}
			dominantBaseline={middle ? "central" : undefined}
			className={className}
		>
			{children}
		</text>
	);
}

/** A rounded panel. Children render above the rect, so text can join it. */
export function Panel({
	x,
	y,
	w,
	h,
	rx = RADIUS.sm,
	className = "fill-elevated stroke-hairline",
	children,
}: {
	x: number;
	y: number;
	w: number;
	h: number;
	rx?: number;
	className?: string;
	children?: ReactNode;
}) {
	return (
		<g>
			<rect x={x} y={y} width={w} height={h} rx={rx} className={className} />
			{children}
		</g>
	);
}

/** A numbered step marker (the badges the pairing/handoff flows read by). */
export function Badge({
	x,
	y,
	n,
	r = 11,
}: {
	x: number;
	y: number;
	n: number | string;
	r?: number;
}) {
	return (
		<g>
			<circle cx={x} cy={y} r={r} className="fill-accent-wash stroke-accent" />
			<Txt x={x} y={y} anchor="middle" middle className="fill-accent text-meta">
				{n}
			</Txt>
		</g>
	);
}

/** A small labelled capsule (rx follows the site radius scale, no pills). */
export function Chip({
	x,
	y,
	w,
	h = 30,
	text,
	mono = false,
	className = "fill-surface stroke-hairline",
	textClassName = "fill-ink-muted text-meta",
}: {
	x: number;
	y: number;
	w: number;
	h?: number;
	text: string;
	mono?: boolean;
	className?: string;
	textClassName?: string;
}) {
	return (
		<g>
			<rect
				x={x}
				y={y}
				width={w}
				height={h}
				rx={RADIUS.sm}
				className={className}
			/>
			<Txt
				x={x + w / 2}
				y={y + h / 2}
				anchor="middle"
				middle
				className={
					mono ? "fill-ink-muted font-mono text-mono-sm" : textClassName
				}
			>
				{text}
			</Txt>
		</g>
	);
}
