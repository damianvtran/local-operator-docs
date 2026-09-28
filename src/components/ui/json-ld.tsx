import type { JsonLdObject } from "@/lib/structured-data";

/**
 * A JSON-LD script tag, built from server data only.
 *
 * `dangerouslySetInnerHTML` is the standard (and only) way to emit JSON-LD
 * from React: the payload is `JSON.stringify` of a literal object this site
 * constructed — never user input — and React would otherwise escape the
 * quotes into `&quot;`, which breaks the JSON inside the script.
 */
export function JsonLd({ data }: { data: JsonLdObject }) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: static, server-built JSON (see above)
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	);
}
