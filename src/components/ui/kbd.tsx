import type { ReactNode } from "react";

/** Kbd: a key or chord the reader presses, in the machine voice. */
export function Kbd({ children }: { children: ReactNode }) {
	return (
		<kbd className="rounded-xs border border-hairline bg-surface px-1.5 py-0.5 font-mono text-mono-sm text-ink-muted">
			{children}
		</kbd>
	);
}
