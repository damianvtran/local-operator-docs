import Link from "next/link";
import { SearchTrigger } from "@/components/search/search-trigger";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { GitHubMark } from "@/components/ui/github-mark";
import { LogoMark } from "@/components/ui/logo-mark";
import { buildVersions } from "@/lib/built-versions";
import { SITE } from "@/lib/site";
import { MobileNav } from "./mobile-nav";
import type { SidebarGroup } from "./sidebar";
import { VersionChip } from "./version-chip";

/**
 * The top bar: identity, search, theme, GitHub, and the mobile nav trigger.
 *
 * A server component that renders client children (search trigger, theme
 * menu, mobile sheet) — no state of its own, so it can pre-render.
 */
export function TopBar({ groups }: { groups: SidebarGroup[] }) {
	return (
		<header className="sticky top-0 z-40 border-b border-hairline bg-canvas">
			<div className="mx-auto flex h-[var(--header-height)] w-full max-w-[96rem] items-center gap-3 px-4">
				<MobileNav groups={groups} />
				<Link
					href="/"
					className="flex items-center gap-2 rounded-sm"
					aria-label="Local Operator home"
				>
					<LogoMark className="size-6 text-ink" />
					<span className="text-body font-semibold text-ink">{SITE.name}</span>
					<span className="text-body text-ink-dim">Docs</span>
				</Link>

				<div className="ml-auto flex items-center gap-2">
					<VersionChip initial={buildVersions().backend} />
					<SearchTrigger />
					<ThemeToggle />
					<a
						href={SITE.github}
						target="_blank"
						rel="noreferrer"
						aria-label="Local Operator on GitHub"
						className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted transition-colors duration-fast hover:bg-surface hover:text-ink"
					>
						<GitHubMark className="size-4" />
					</a>
				</div>
			</div>
		</header>
	);
}
