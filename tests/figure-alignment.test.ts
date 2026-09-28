import Markdoc from "@markdoc/markdoc";
import * as React from "react";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { markdocComponents, transformDoc } from "@/lib/markdoc-config";

/**
 * Figures stay in the article's CONTENT track.
 *
 * The alignment rule lives in the components, not in CSS: `.docs-article > *`
 * is placed in the 46rem content track by default and only a `lo-bleed` child
 * takes the wider 58rem track. A figure that regains that class silently
 * renders 6rem wider than every paragraph beside it — the defect this file
 * pins — so the guard is on the rendered markup, through the same Markdoc
 * pipeline the content pages use.
 */

function renderSource(source: string): string {
	const ast = Markdoc.parse(source);
	const rendered = Markdoc.renderers.react(transformDoc(ast), React, {
		components: markdocComponents,
	});
	return renderToStaticMarkup(createElement(Fragment, null, rendered));
}

describe("figure alignment", () => {
	it("renders a figure tag without the bleed track", () => {
		const markup = renderSource(
			'{% figure src="/shots/tui/welcome.png" alt="The welcome screen" caption="First launch." /%}',
		);
		expect(markup).toContain("<figure");
		expect(markup).toContain("<figcaption");
		expect(markup).not.toContain("lo-bleed");
	});

	it("keeps the placeholder branch in the content track too", () => {
		const markup = renderSource('{% figure caption="No screenshot yet." /%}');
		expect(markup).toContain("<figure");
		expect(markup).toContain("border-dashed");
		expect(markup).not.toContain("lo-bleed");
	});

	it("renders a diagram without the bleed track", () => {
		const markup = renderSource(
			'{% diagram name="SurfaceMap" caption="One runtime, many ways in." /%}',
		);
		expect(markup).toContain("<figure");
		expect(markup).not.toContain("lo-bleed");
	});
});
