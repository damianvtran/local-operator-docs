import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DIAGRAMS, Diagram, getDiagram } from "@/components/diagrams";

/**
 * The diagram layer's invariants, per component:
 *
 *   - every registered diagram renders, and carries `role="img"` plus a
 *     <title>/<desc> wired to the name and description;
 *   - the geometry stays in the declared budget (720 wide, ≤ 640 tall);
 *   - the `{% diagram %}` tag's fallback is visible and loud for an unknown
 *     name — the failure mode this layer exists to prevent is a silently
 *     missing figure.
 */

const FROZEN_NAMES = [
	"AidaCadence",
	"EcosystemMap",
	"ExecPipeline",
	"HubPublishFlow",
	"MeshPairingFlow",
	"RelayFlow",
	"SchedulePipeline",
	"SdkLifecycle",
	"SessionHandoff",
	"SseSequence",
	"SupplyFlow",
	"SurfaceMap",
];

/** React escapes text nodes; match either the raw or the escaped spelling. */
function appears(markup: string, text: string): boolean {
	const escaped = text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;");
	return markup.includes(text) || markup.includes(escaped);
}

describe("diagram registry", () => {
	it("registers exactly the frozen twelve names", () => {
		expect(Object.keys(DIAGRAMS).sort()).toEqual(FROZEN_NAMES);
	});

	it("resolves known names and rejects unknown ones", () => {
		expect(getDiagram("SurfaceMap")).toBeDefined();
		expect(getDiagram("Nope")).toBeUndefined();
		expect(getDiagram(undefined)).toBeUndefined();
	});

	for (const [name, entry] of Object.entries(DIAGRAMS)) {
		it(`${name} renders with a title, a desc and the declared geometry`, () => {
			const markup = renderToStaticMarkup(
				createElement(entry.Component, {
					title: entry.title,
					description: entry.description,
				}),
			);
			expect(markup).toContain('role="img"');
			expect(markup).toContain("<title");
			expect(markup).toContain("<desc");
			expect(appears(markup, entry.title)).toBe(true);
			expect(appears(markup, entry.description)).toBe(true);

			const viewBox = markup.match(/viewBox="0 0 (\d+) (\d+)"/);
			expect(viewBox, `${name} has a viewBox`).not.toBeNull();
			const [, width, height] = viewBox as RegExpMatchArray;
			expect(Number(width)).toBe(720);
			// The diagram must fit a ~700px-wide article frame without growing
			// taller than the screenshots it sits beside.
			expect(Number(height)).toBeLessThanOrEqual(640);
		});
	}
});

describe("Diagram tag renderer", () => {
	it("renders the frame, the svg and a figcaption for a known name", () => {
		const markup = renderToStaticMarkup(
			createElement(Diagram, {
				name: "SurfaceMap",
				caption: "One runtime, every surface.",
			}),
		);
		expect(markup).not.toContain("lo-bleed");
		/* No `lo-bleed`: the figure sits in the article's content track with the
		 * prose (see `tests/figure-alignment.test.ts` for the rule's own guard). */
		expect(markup).toContain("border-hairline");
		expect(markup).toContain("<figcaption");
		expect(appears(markup, "One runtime, every surface.")).toBe(true);
		// The caption becomes the accessible description when it is present.
		expect(appears(markup, "One runtime, every surface.")).toBe(true);
	});

	it("falls back to the entry description when there is no caption", () => {
		const entry = getDiagram("RelayFlow");
		const markup = renderToStaticMarkup(
			createElement(Diagram, { name: "RelayFlow" }),
		);
		expect(markup).not.toContain("<figcaption");
		expect(appears(markup, entry?.description ?? "")).toBe(true);
	});

	it("renders a visible fallback and warns for an unknown name", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const markup = renderToStaticMarkup(
			createElement(Diagram, { name: "Nope", caption: "A caption" }),
		);
		expect(markup).toContain("Missing diagram: Nope");
		expect(appears(markup, "A caption")).toBe(true);
		expect(markup).toContain("border-dashed");
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]?.[0])).toContain('"Nope"');
		warn.mockRestore();
	});

	it("does not warn when the name resolves", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		renderToStaticMarkup(createElement(Diagram, { name: "EcosystemMap" }));
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});
});
