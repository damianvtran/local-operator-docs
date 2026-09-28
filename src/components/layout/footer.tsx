import Link from "next/link";
import { LogoMark } from "@/components/ui/logo-mark";
import { buildVersions } from "@/lib/built-versions";
import { SITE } from "@/lib/site";
import { VersionNote } from "./version-chip";

/**
 * Footer: identity, the working links, and the "agent-readable" note the
 * brief asks for. Links point at pages that exist (published or draft) —
 * a footer full of planned routes is a footer full of 404s.
 */
const COLUMNS: Array<{
	title: string;
	links: Array<{ label: string; href: string; external?: boolean }>;
}> = [
	{
		title: "Get started",
		links: [
			{
				label: "What is Local Operator?",
				href: "/getting-started/what-is-local-operator",
			},
			{ label: "Install & first run", href: "/getting-started/install" },
			{ label: "Quickstart", href: "/getting-started/quickstart" },
			{
				label: "Choose your surface",
				href: "/getting-started/choose-your-surface",
			},
			{ label: "Updating", href: "/getting-started/updating" },
		],
	},
	{
		title: "Surfaces",
		links: [
			{ label: "Terminal (TUI)", href: "/tui/quickstart" },
			{ label: "Desktop app", href: "/surfaces/desktop" },
			{ label: "Mobile relay", href: "/surfaces/mobile-relay" },
			{
				label: "Browser extension",
				href: "/surfaces/browser-extension",
			},
		],
	},
	{
		title: "Community",
		links: [
			{ label: "GitHub", href: SITE.github, external: true },
			{ label: "Releases", href: SITE.githubReleases, external: true },
			{ label: "local-operator.com", href: SITE.marketing, external: true },
		],
	},
	{
		title: "Contact",
		links: [{ label: SITE.email, href: `mailto:${SITE.email}` }],
	},
];

export function Footer() {
	return (
		<footer className="mt-16 border-t border-hairline">
			<div className="mx-auto grid w-full max-w-[96rem] gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-5">
				<div className="lg:col-span-1">
					<div className="flex items-center gap-2">
						<LogoMark className="size-5 text-ink" />
						<span className="text-body font-semibold text-ink">
							{SITE.name}
						</span>
					</div>
					<p className="mt-3 max-w-[24ch] text-body-sm text-ink-dim">
						Local-first agents for your terminal, desktop, and phone.
					</p>
					<p className="mt-4 text-body-sm text-ink-dim">
						These docs are agent-readable —{" "}
						<Link
							href="/llms.txt"
							className="underline decoration-hairline underline-offset-2 hover:text-ink"
						>
							/llms.txt
						</Link>
					</p>
				</div>
				{COLUMNS.map((column) => (
					<nav key={column.title} aria-label={column.title}>
						<h2 className="mb-3 text-meta font-semibold uppercase tracking-wider text-ink-dim">
							{column.title}
						</h2>
						<ul className="space-y-2">
							{/* Link rows keep min-h-6 — 24px, the touch-target floor; at
							    16px tall they were under it (UX round 1, U6). */}
							{column.links.map((link) => (
								<li key={link.label}>
									{link.external ? (
										<a
											href={link.href}
											target="_blank"
											rel="noreferrer"
											className="inline-flex min-h-6 items-center text-body-sm text-ink-muted transition-colors duration-fast hover:text-ink"
										>
											{link.label}
										</a>
									) : (
										<Link
											href={link.href}
											className="inline-flex min-h-6 items-center text-body-sm text-ink-muted transition-colors duration-fast hover:text-ink"
										>
											{link.label}
										</Link>
									)}
								</li>
							))}
						</ul>
					</nav>
				))}
			</div>
			<div className="border-t border-hairline">
				<div className="mx-auto flex w-full max-w-[96rem] items-center justify-between gap-4 px-4 py-4 text-meta text-ink-dim">
					<span>MIT-licensed, like the runtime.</span>
					<VersionNote initial={buildVersions().backend} />
				</div>
			</div>
		</footer>
	);
}
