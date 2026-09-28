"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	applyTheme,
	readPreference,
	resolveTheme,
	setPreference,
	THEME_CHANGE_EVENT,
	type ThemePreference,
} from "@/lib/theme";

const OPTIONS: Array<{
	value: ThemePreference;
	label: string;
	icon: typeof Sun;
}> = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
];

/**
 * Theme control: light / dark / system.
 *
 * The initial render is deliberately the neutral "System" state and the real
 * preference is read in an effect — reading localStorage during render would
 * mismatch the server HTML (which cannot know it) and trip hydration. The
 * PRE-FIRST-PAINT correctness is not this component's job: the inline script
 * in app/layout.tsx has already applied the stored theme before paint; this
 * menu only owns what happens after a click.
 */
export function ThemeToggle() {
	const [preference, setCurrent] = useState<ThemePreference>("system");

	useEffect(() => {
		setCurrent(readPreference());
		// The palette's "Toggle theme" writes through lib/theme.ts, not through
		// this menu, so re-read on the event it fires — otherwise the icon and
		// title describe the previous preference until reload (QA round 1, Q1).
		const onPreferenceChange = () => setCurrent(readPreference());
		window.addEventListener(THEME_CHANGE_EVENT, onPreferenceChange);
		// Keep "system" honest while the OS preference changes underneath us.
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			if (readPreference() === "system") applyTheme(resolveTheme("system"));
		};
		media.addEventListener("change", onChange);
		return () => {
			media.removeEventListener("change", onChange);
			window.removeEventListener(THEME_CHANGE_EVENT, onPreferenceChange);
		};
	}, []);

	function choose(next: ThemePreference) {
		setCurrent(next);
		setPreference(next);
	}

	const Icon =
		preference === "system" ? Monitor : preference === "dark" ? Moon : Sun;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label="Theme"
				title={`Theme: ${preference}`}
				className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted transition-colors duration-fast hover:bg-surface hover:text-ink"
			>
				<Icon className="size-4" aria-hidden="true" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{OPTIONS.map((option) => (
					<DropdownMenuItem
						key={option.value}
						onSelect={() => choose(option.value)}
						className="gap-2"
					>
						<option.icon className="size-4" aria-hidden="true" />
						{option.label}
						{preference === option.value ? (
							<Check
								className="ml-auto size-3.5 text-accent"
								aria-hidden="true"
							/>
						) : null}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
