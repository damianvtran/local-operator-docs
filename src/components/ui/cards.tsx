import {
	ArrowRight,
	Blocks,
	BookOpen,
	CalendarClock,
	Code,
	Compass,
	Download,
	Globe,
	type LucideIcon,
	Monitor,
	Network,
	Puzzle,
	Radio,
	Rocket,
	Smartphone,
	SquareTerminal,
	Terminal,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Cards and Card: link cards for home grids and "next steps" blocks.
 *
 * Icons are named in content (`icon="rocket"`) and resolved through an
 * allowlist — content may not name an arbitrary import, and an unknown name
 * falls back rather than failing a build over a decoration.
 */
const ICONS: Record<string, LucideIcon> = {
	rocket: Rocket,
	compass: Compass,
	download: Download,
	terminal: Terminal,
	"terminal-square": SquareTerminal,
	"square-terminal": SquareTerminal,
	smartphone: Smartphone,
	monitor: Monitor,
	"calendar-clock": CalendarClock,
	network: Network,
	blocks: Blocks,
	code: Code,
	radio: Radio,
	globe: Globe,
	puzzle: Puzzle,
};

export function Cards({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>
	);
}

export function Card({
	title,
	href,
	icon,
	children,
}: {
	title: string;
	href: string;
	icon?: string;
	children?: ReactNode;
}) {
	const Icon = (icon && ICONS[icon]) || BookOpen;
	const external = /^https?:\/\//.test(href);

	const body = (
		<>
			<span className="flex items-center gap-2 text-heading font-semibold text-ink">
				<Icon className="size-4 text-accent" aria-hidden="true" />
				{title}
				<ArrowRight
					className="ml-auto size-4 text-ink-dim transition-transform duration-fast ease-out-quart group-hover:translate-x-0.5"
					aria-hidden="true"
				/>
			</span>
			{children ? (
				<span className="text-body-sm text-ink-muted">{children}</span>
			) : null}
		</>
	);

	const className =
		"group flex flex-col gap-1.5 rounded-md border border-hairline bg-surface p-4 transition-colors duration-fast ease-out-quart hover:border-control";

	return external ? (
		<a href={href} target="_blank" rel="noreferrer" className={className}>
			{body}
		</a>
	) : (
		<Link href={href} className={className}>
			{body}
		</Link>
	);
}
