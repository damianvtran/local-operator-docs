import { createHighlighter, type Highlighter } from "shiki";
import { loDark, loLight } from "./shiki-theme";

/**
 * The Shiki highlighter singleton.
 *
 * A singleton, not `codeToHtml` per call: the naive import pulls Shiki's
 * whole bundle and re-registers themes for every block on every render.
 * Server-only usage (the CodeBlock component is a server component), so this
 * never reaches the client bundle.
 *
 * The language set is deliberately the languages the content uses. An
 * unknown language falls back to plaintext rather than throwing — a fence
 * with a typo must not take the build down.
 */
const LANGS = [
	"bash",
	"python",
	"json",
	"yaml",
	"toml",
	"markdown",
	"typescript",
	"javascript",
	"tsx",
	"jsx",
	"docker",
	"diff",
	"ini",
	"sql",
	"text",
];

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: [loDark, loLight],
			langs: LANGS,
		});
	}
	return highlighterPromise;
}

export async function highlightCode(
	code: string,
	language?: string,
): Promise<string> {
	const highlighter = await getHighlighter();
	const requested = language ?? "text";
	const lang = highlighter.getLoadedLanguages().includes(requested)
		? requested
		: "text";
	return highlighter.codeToHtml(code, {
		lang,
		themes: { light: "lo-light", dark: "lo-dark" },
		defaultColor: false,
	});
}
