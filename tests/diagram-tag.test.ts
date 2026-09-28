import Markdoc from "@markdoc/markdoc";
import * as React from "react";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { markdocComponents, transformDoc } from "@/lib/markdoc-config";

/**
 * The `{% diagram %}` tag through the real Markdoc pipeline — parse,
 * transform with the site config, render with the site component map. This
 * is the same path a content page takes, so it catches a tag that is missing
 * from the config or a component missing from the render map, which a
 * component-level test cannot.
 */

function renderSource(source: string): string {
	const ast = Markdoc.parse(source);
	const rendered = Markdoc.renderers.react(transformDoc(ast), React, {
		components: markdocComponents,
	});
	return renderToStaticMarkup(createElement(Fragment, null, rendered));
}

describe("{% diagram %} through the markdoc pipeline", () => {
	it("renders the registered component with the caption below", () => {
		const markup = renderSource(
			'{% diagram name="MeshPairingFlow" caption="A token, a code, a person." /%}',
		);
		expect(markup).toContain('role="img"');
		expect(markup).toContain("<title");
		expect(markup).toContain("A token, a code, a person.");
		expect(markup).toContain("<figcaption");
		expect(markup).toContain("border-hairline");
	});

	it("warns and shows the fallback for an unknown name", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const markup = renderSource('{% diagram name="NotADiagram" /%}');
		expect(markup).toContain("Missing diagram: NotADiagram");
		expect(markup).toContain("border-dashed");
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('"NotADiagram"'));
		warn.mockRestore();
	});
});
