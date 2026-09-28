"use client";

import {
	CalendarClock,
	Compass,
	Download,
	Keyboard,
	type LucideIcon,
	Network,
	Smartphone,
	Sun,
} from "lucide-react";
import { tokenizeQuery } from "@/lib/search/tokenizer";
import { SITE } from "@/lib/site";
import { readPreference, resolveTheme, setPreference } from "@/lib/theme";

/**
 * The palette's actions layer: the palette as a ROUTER of intents, not only
 * a search box. "Install Local Operator" copies the real command; "Connect my
 * phone" navigates to the relay; the theme action flips the theme. Each
 * action carries keywords so the same scoring vocabulary finds it ("pip",
 * "setup", "celphone"? no — the words people actually type).
 */
export type PaletteAction = {
	id: string;
	title: string;
	subtitle: string;
	keywords: string[];
	icon: LucideIcon;
	run: () => void;
};

export type ActionContext = {
	navigate: (href: string) => void;
	copy: (text: string) => Promise<boolean>;
	toast: (message: string) => void;
	openShortcuts: () => void;
};

export function buildActions(ctx: ActionContext): PaletteAction[] {
	return [
		{
			id: "install",
			title: "Install Local Operator",
			subtitle: `Copy “${SITE.installCommand}”`,
			keywords: [
				"install",
				"pip",
				"pipx",
				"uv",
				"setup",
				"download",
				"terminal",
			],
			icon: Download,
			run: () => {
				void ctx.copy(SITE.installCommand).then((ok) => {
					ctx.toast(
						ok
							? "Install command copied"
							: "Copy failed — select the command on the install page",
					);
				});
			},
		},
		{
			id: "choose-your-surface",
			title: "Choose your surface",
			subtitle: "TUI, desktop app, phone, or headless",
			keywords: ["surface", "choose", "compare", "which", "tui", "desktop"],
			icon: Compass,
			run: () => ctx.navigate("/getting-started/choose-your-surface"),
		},
		{
			id: "connect-phone",
			title: "Connect my phone",
			subtitle: "Mobile relay — watch and steer sessions from your phone",
			keywords: ["phone", "mobile", "relay", "remote", "iphone", "android"],
			icon: Smartphone,
			run: () => ctx.navigate("/surfaces/mobile-relay"),
		},
		{
			id: "pair-computer",
			title: "Pair another computer",
			subtitle: "Agent Mesh — sessions across your devices",
			keywords: ["pair", "mesh", "network", "devices", "machines", "second"],
			icon: Network,
			run: () => ctx.navigate("/capabilities/agent-mesh"),
		},
		{
			id: "schedule-job",
			title: "Schedule a nightly job",
			subtitle: "Workflow automations — wakes and background jobs",
			keywords: [
				"schedule",
				"cron",
				"nightly",
				"automation",
				"wake",
				"background",
				"job",
			],
			icon: CalendarClock,
			run: () => ctx.navigate("/capabilities/workflow-automations"),
		},
		{
			id: "toggle-theme",
			title: "Toggle theme",
			subtitle: "Switch between light and dark",
			keywords: ["theme", "dark", "light", "appearance", "colour", "color"],
			icon: Sun,
			run: () => {
				const next =
					resolveTheme(readPreference()) === "dark" ? "light" : "dark";
				setPreference(next);
				ctx.toast(`Theme: ${next}`);
			},
		},
		{
			id: "shortcuts",
			title: "Keyboard shortcuts",
			subtitle: "Search, navigation chords, palette keys",
			keywords: ["shortcuts", "keys", "keyboard", "help", "chords"],
			icon: Keyboard,
			run: () => ctx.openShortcuts(),
		},
	];
}

/** Tokenized haystack for an action, for query matching. */
export function actionTokens(action: PaletteAction): string[] {
	return tokenizeQuery(
		`${action.title} ${action.subtitle} ${action.keywords.join(" ")}`,
	);
}

/** Every query token must prefix-match somewhere in the action. */
export function actionMatches(
	action: PaletteAction,
	queryTokens: string[],
): boolean {
	if (queryTokens.length === 0) return true;
	const haystack = actionTokens(action);
	return queryTokens.every((token) =>
		haystack.some(
			(candidate) => candidate === token || candidate.startsWith(token),
		),
	);
}
