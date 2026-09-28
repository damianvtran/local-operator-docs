"use client";

import Link from "next/link";
import { SITE } from "@/lib/site";
import { useBackendVersion } from "@/lib/use-version-refresh";
import { cn } from "@/lib/utils";

/**
 * The runtime version, as the top bar shows it.
 *
 * `initial` is the build-time value — `public/versions.json` from
 * `scripts/generate-versions.ts`, or the committed fallback — rendered on the
 * server, so the chip is never blank and hydration has nothing to reconcile.
 * The hook may then move it forward to a release published since the deploy;
 * the swap is in place, and because the chip is monospace (fixed digit
 * widths) and semver bumps keep their length, no neighbour in the bar moves.
 * It never shrinks back: the hook only accepts a NEWER value.
 */
export function VersionChip({ initial }: { initial: string }) {
	const version = useBackendVersion(initial);

	return (
		<Link
			href={SITE.githubReleases}
			target="_blank"
			rel="noreferrer"
			className={cn(
				"hidden items-center rounded-sm border border-hairline px-2 font-mono text-mono-sm text-ink-dim transition-colors duration-fast hover:border-control hover:text-ink sm:inline-flex",
				/*
				 * `h-9` is the top bar's control height, not a per-control choice: the
				 * search field beside it and the theme/GitHub buttons are all 36px, so
				 * the chip matches them rather than sizing to its own text (round-3
				 * operator finding: the chip sat 27.4px against the field's 36px).
				 */
				"h-9",
			)}
			title={`Local Operator v${version} release notes`}
		>
			v{version}
		</Link>
	);
}

/**
 * The same value in the footer's own voice ("docs for vX.Y.Z").
 *
 * A second consumer of one hook, which is the point: the chip and the footer
 * cannot disagree about which release these docs are for, and the shared
 * in-flight promise means the second consumer costs no request.
 */
export function VersionNote({ initial }: { initial: string }) {
	const version = useBackendVersion(initial);

	return <span className="font-mono">docs for v{version}</span>;
}
