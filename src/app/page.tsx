import { ArrowRight, Download, Sparkles } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Figure } from "@/components/ui/figure";
import { JsonLd } from "@/components/ui/json-ld";
import { buildVersions } from "@/lib/built-versions";
import { getResolvedNav, type ResolvedItem } from "@/lib/content";
import { SITE } from "@/lib/site";
import {
	softwareApplicationSchema,
	websiteSchema,
} from "@/lib/structured-data";
import { cn } from "@/lib/utils";

/**
 * The home page.
 *
 * Bands, in order: hero → "Start here" → "By surface" → "What it can do" →
 * "Build on it". They are the taxonomy's own shape — the same groups the
 * sidebar uses — so the page cannot advertise a surface the docs do not
 * acknowledge.
 *
 * Availability is derived from the nav registry x content, exactly like the
 * sidebar: a card for a page that does not exist YET renders as a non-link
 * "Planned" tile instead of a 404, and a draft page renders as a link with a
 * "Preview" chip. That derivation is why this file has no hardcoded hrefs
 * beyond the home-page shortcuts.
 */
const nav = () => getResolvedNav().flatMap((group) => group.items);
const item = (id: string): ResolvedItem => {
	const found = nav().find((candidate) => candidate.id === id);
	if (!found) throw new Error(`home page references unknown nav id "${id}"`);
	return found;
};

const POPULAR: Array<{ label: string; id: string }> = [
	{ label: "Install", id: "install" },
	{ label: "Connect my phone", id: "mobile-relay" },
	{ label: "Schedule a nightly job", id: "workflow-automations" },
	{ label: "Pair another computer", id: "agent-mesh" },
];

const START_HERE = [
	"what-is",
	"install",
	"choose-your-surface",
	"quickstart",
	"updating",
];
const BY_SURFACE = ["terminal", "desktop", "mobile-relay", "browser-extension"];
const CAPABILITIES = [
	"workflow-automations",
	"always-on",
	"agent-mesh",
	"agent-hub",
];
const BUILD = ["exec-mode", "python-sdk", "sse-streaming", "ecosystem"];

function Band({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="border-b border-hairline">
			<div className="mx-auto w-full max-w-[96rem] px-4 py-12">
				<h2 className="mb-6 text-title text-ink">{title}</h2>
				{children}
			</div>
		</section>
	);
}

function Tile({ entry, big = false }: { entry: ResolvedItem; big?: boolean }) {
	const description = entry.page?.description;
	const inner = (
		<>
			<span className="flex items-start justify-between gap-3">
				<span
					className={cn(
						"font-semibold text-ink",
						big ? "text-heading" : "text-body",
					)}
				>
					{entry.title}
				</span>
				{entry.status === "planned" ? (
					<span className="shrink-0 rounded-xs border border-hairline px-1.5 py-0.5 font-mono text-mono-sm text-ink-dim">
						Planned
					</span>
				) : entry.status === "draft" ? (
					<span className="shrink-0 rounded-xs border border-hairline px-1.5 py-0.5 font-mono text-mono-sm text-ink-dim">
						Preview
					</span>
				) : (
					<ArrowRight
						className="mt-0.5 size-4 shrink-0 text-ink-dim transition-transform duration-fast ease-out-quart group-hover:translate-x-0.5"
						aria-hidden="true"
					/>
				)}
			</span>
			{description ? (
				<span className="text-body-sm text-ink-muted">{description}</span>
			) : null}
		</>
	);

	if (entry.status === "planned") {
		return (
			<div className="flex flex-col gap-1.5 rounded-md border border-dashed border-hairline p-5">
				{inner}
			</div>
		);
	}
	return (
		<Link
			href={entry.href}
			className="group flex flex-col gap-1.5 rounded-md border border-hairline bg-surface p-5 transition-colors duration-fast ease-out-quart hover:border-control"
		>
			{inner}
		</Link>
	);
}

export default function HomePage() {
	/*
	 * Structured data: the site entity plus the application these docs are
	 * about, versioned from the same build-time resolution the top-bar chip
	 * reads (`versions.ts`) so the two cannot disagree.
	 */
	const versions = buildVersions();

	return (
		<div>
			<JsonLd data={websiteSchema()} />
			<JsonLd data={softwareApplicationSchema(versions.backend)} />
			<section className="border-b border-hairline">
				<div className="mx-auto w-full max-w-[96rem] px-4 py-16 sm:py-20">
					{/*
					 * `id` is a generator hook, not styling: `scripts/generate-og-images.mjs`
					 * reads the eyebrow off the live page as the home card's section chip,
					 * the same contract as the marketing site's `#hero-heading` hooks. A
					 * renamed hook is a loud failure there, not a silently stale card.
					 */}
					<p
						id="home-eyebrow"
						className="flex items-center gap-2 font-mono text-mono-sm uppercase tracking-wider text-accent"
					>
						<Sparkles className="size-3.5" aria-hidden="true" />
						Local-first agent runtime
					</p>
					<h1 className="mt-4 max-w-[24ch] text-display text-ink">
						Run agents where your work lives.
					</h1>
					<p className="mt-4 max-w-[62ch] text-body text-ink-muted">
						{SITE.description}
					</p>

					<div className="mt-7 flex flex-wrap items-center gap-3">
						<span className="flex items-center gap-2 rounded-sm border border-hairline bg-surface px-3 py-2 font-mono text-mono text-ink">
							{SITE.installCommand}
							<CopyButton
								value={SITE.installCommand}
								ariaLabel="Copy the install command"
								className="border-0 bg-transparent px-0 hover:bg-transparent"
							/>
						</span>
						<Link
							href={item("install").href}
							className={cn(buttonVariants({ variant: "primary" }))}
						>
							Get started
						</Link>
						<a
							href={SITE.downloads}
							target="_blank"
							rel="noreferrer"
							className={cn(buttonVariants({ variant: "outline" }))}
						>
							<Download className="size-4" aria-hidden="true" />
							Download the app
						</a>
					</div>

					<div className="mt-7 flex flex-wrap items-center gap-2 text-body-sm text-ink-dim">
						<span>Popular:</span>
						{POPULAR.map((shortcut) => {
							const entry = item(shortcut.id);
							return entry.status === "planned" ? (
								<span
									key={shortcut.id}
									className="rounded-sm border border-dashed border-hairline px-2 py-1"
								>
									{shortcut.label}
								</span>
							) : (
								<Link
									key={shortcut.id}
									href={entry.href}
									className="rounded-sm border border-hairline px-2 py-1 transition-colors duration-fast hover:border-control hover:text-ink"
								>
									{shortcut.label}
								</Link>
							);
						})}
					</div>

					<div className="mt-10">
						<Figure
							src="/shots/ui/app-shell-chat-light.webp"
							darkSrc="/shots/ui/app-shell-chat-dark.webp"
							width={1280}
							height={900}
							alt="The desktop app running a session: the sidebar's agents, teams and recent chats, the conversation with its tool receipts, a drafted follow-up in the composer, and run details listing two running subagents and the session's to-dos."
							caption="A working session in the desktop app: tool receipts in the conversation, a follow-up drafted in the composer, and two subagents running beside the to-dos."
						/>
					</div>
				</div>
			</section>

			<Band title="Start here">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
					{START_HERE.map((id) => (
						<Tile key={id} entry={item(id)} />
					))}
				</div>
			</Band>

			<Band title="By surface">
				<div className="grid gap-4 sm:grid-cols-2">
					{BY_SURFACE.map((id) => (
						<Tile key={id} entry={item(id)} big />
					))}
				</div>
			</Band>

			<Band title="What it can do">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{CAPABILITIES.map((id) => (
						<Tile key={id} entry={item(id)} />
					))}
				</div>
			</Band>

			<Band title="Build on it">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{BUILD.map((id) => (
						<Tile key={id} entry={item(id)} />
					))}
				</div>
			</Band>
		</div>
	);
}
