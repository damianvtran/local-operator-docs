/**
 * Theme persistence and application for the light / dark / system control.
 *
 * The FIRST paint is handled by the inline script (`THEME_SCRIPT`) baked into
 * app/layout.tsx; this module is the read / apply / persist surface the toggle
 * and the palette action use afterwards. Keeping the two in one file means
 * the storage key and the class/attribute names cannot drift apart — a
 * mismatch there is a light-mode flash, the exact defect the pre-paint script
 * exists to prevent.
 */
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "lop-docs-theme";

/** Applied before first paint, inline in <head>. Kept dependency-free. */
export const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var d=s==="light"?false:s==="dark"?true:window.matchMedia("(prefers-color-scheme: dark)").matches;var r=document.documentElement;r.classList.toggle("dark",d);r.dataset.theme=d?"localOperatorDark":"localOperatorLight";}catch(e){}})();`;

export function systemPrefersDark(): boolean {
	return (
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	);
}

export function readPreference(): ThemePreference {
	if (typeof window === "undefined") return "system";
	const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
	return stored === "light" || stored === "dark" || stored === "system"
		? stored
		: "system";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
	if (preference === "system") return systemPrefersDark() ? "dark" : "light";
	return preference;
}

/** Applies the class + data-theme contract the palettes/stylesheets read. */
export function applyTheme(theme: ResolvedTheme): void {
	const root = document.documentElement;
	root.classList.toggle("dark", theme === "dark");
	root.dataset.theme =
		theme === "dark" ? "localOperatorDark" : "localOperatorLight";
}

export function setPreference(preference: ThemePreference): ResolvedTheme {
	window.localStorage.setItem(THEME_STORAGE_KEY, preference);
	const resolved = resolveTheme(preference);
	applyTheme(resolved);
	return resolved;
}
