import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `cn` with the design system's vocabulary taught to tailwind-merge.
 *
 * This is not optional polish. tailwind-merge only knows about the default
 * Tailwind scales, so with the stock config `cn("text-body", "text-ink-muted")`
 * treats BOTH classes as the same conflict group and silently drops the
 * font-size step — the whole type scale becomes a no-op and every build stays
 * green. The class groups below tell it that `text-body` is a size and
 * `text-ink-muted` is a colour, so they coexist while `text-title` correctly
 * overrides `text-body`.
 *
 * Keep the role lists in sync with the `@theme` block in src/app/globals.css.
 */
export const TYPE_STEPS = [
	"display",
	"title",
	"heading",
	"body",
	"body-sm",
	"meta",
	"mono",
	"mono-sm",
] as const;

/** Colour roles produced by `@theme` (`bg-<role>`, `text-<role>`, ...). */
export const COLOR_ROLES = [
	"canvas",
	"surface",
	"elevated",
	"sunken",
	"ink",
	"ink-muted",
	"ink-dim",
	"ink-disabled",
	"hairline",
	"control",
	"accent",
	"accent-hover",
	"accent-active",
	"accent-wash",
	"on-accent",
	"success",
	"success-wash",
	"success-border",
	"warning",
	"warning-wash",
	"warning-border",
	"danger",
	"danger-wash",
	"danger-border",
	"info",
	"info-wash",
	"info-border",
	"scrim",
] as const;

const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": [{ text: [...TYPE_STEPS] }],
			"text-color": [{ text: [...COLOR_ROLES] }],
			"bg-color": [{ bg: [...COLOR_ROLES] }],
			"border-color": [{ border: [...COLOR_ROLES] }],
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
