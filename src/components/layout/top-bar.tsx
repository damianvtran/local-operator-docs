import Link from "next/link";
import { SearchTrigger } from "@/components/search/search-trigger";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LogoMark } from "@/components/ui/logo-mark";
import { buildStars, buildVersions } from "@/lib/built-versions";
import { SITE } from "@/lib/site";
import { GitHubStars } from "./github-stars";
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
					<GitHubStars initial={buildStars()} />
				</div>
			</div>
		</header>
	);
}
