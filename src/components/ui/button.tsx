import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Button.
 *
 * One accent, spent here and nowhere else in a row. Hover is a colour step on
 * the variant's own ramp — nothing lifts, scales, or gains a shadow; disabled
 * is a colour, never an opacity (an opacity-faded control fades its own
 * background too and lands on a different colour per ground).
 */
const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium transition-colors duration-fast ease-out-quart disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				primary:
					"bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-active disabled:bg-sunken disabled:text-ink-disabled",
				outline:
					"border border-control bg-transparent text-ink hover:bg-surface disabled:border-hairline disabled:text-ink-disabled",
				ghost:
					"bg-transparent text-ink-muted hover:bg-surface hover:text-ink disabled:text-ink-disabled",
			},
			size: {
				sm: "h-8 px-3 text-body-sm [&_svg]:size-3.5",
				md: "h-9 px-4 text-body-sm [&_svg]:size-4",
				icon: "size-9 text-body [&_svg]:size-4",
			},
		},
		defaultVariants: {
			variant: "outline",
			size: "md",
		},
	},
);

export type ButtonProps = React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
	return (
		<button
			type="button"
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { buttonVariants };
