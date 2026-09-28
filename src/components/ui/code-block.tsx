import { highlightCode } from "@/lib/shiki";
import { CopyButton } from "./copy-button";

/**
 * The code block — the highest-value surface on a documentation site.
 *
 * SURFACE OWNERSHIP is explicit and must stay that way: Shiki writes the
 * theme background as CSS custom properties on the <pre> it generates, so
 * the <pre> (styled by `.lo-codeblock pre.shiki` in globals.css) owns the
 * fill, while this wrapper owns the border, the radius and the header row and
 * sets NO background utility. A `bg-*` class here would compile, ship, and
 * paint nothing — the radient-docs failure the brief names.
 *
 * The dual theme means one render serves both modes: Shiki emits both
 * palettes as variables, and `data-theme` on <html> picks one in CSS.
 */
export async function CodeBlock({
	code,
	language,
}: {
	code: string;
	language?: string;
}) {
	const language_ =
		language && language !== "text" && language !== "plaintext"
			? language
			: null;
	const html = await highlightCode(code, language ?? undefined);

	return (
		<div className="lo-codeblock">
			{language_ ? (
				<div className="lo-codeblock__head">
					<span className="font-mono text-mono-sm uppercase tracking-wider text-ink-dim">
						{language_}
					</span>
				</div>
			) : null}
			{/* Always rendered, never hover-revealed: reachable by keyboard and on touch. */}
			<CopyButton
				value={code}
				ariaLabel="Copy code"
				className={
					language_
						? "absolute right-2 top-9 z-10"
						: "absolute right-2 top-2 z-10"
				}
			/>
			{/* Biome cannot see that this HTML comes from Shiki's own renderer. */}
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki generates the markup for the code we already hold */}
			<div dangerouslySetInnerHTML={{ __html: html }} />
		</div>
	);
}
