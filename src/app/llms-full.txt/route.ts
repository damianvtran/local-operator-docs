import { buildLlmsFullTxt } from "@/lib/llms-full";

/**
 * `/llms-full.txt` — the whole documentation as one markdown file.
 *
 * Prerendered at build (`force-static`), like `/llms.txt` and `/raw/<slug>`,
 * and generated from the same content tree the pages render from — see
 * `src/lib/llms-full.ts` for the shape and why it cannot drift.
 */
export const dynamic = "force-static";

export function GET(): Response {
	return new Response(buildLlmsFullTxt(), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
