import type { ReactNode } from "react";

/**
 * CommandChip: an inline command the reader will run.
 *
 * Deliberately inline (not a block): it marks a command inside a sentence.
 * For anything multiline the content uses a fenced code block instead.
 */
export function CommandChip({ children }: { children: ReactNode }) {
	return (
		<code className="rounded-xs border border-hairline bg-sunken px-1.5 py-0.5 font-mono text-mono text-ink">
			{children}
		</code>
	);
}
