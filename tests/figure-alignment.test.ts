import Markdoc from "@markdoc/markdoc";
import * as React from "react";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { markdocComponents, transformDoc } from "@/lib/markdoc-config";

/**
 * Content components stay in the article's ONE measure.
 *
 * The alignment rule lives in the components, not in CSS: every direct child
 * of `.docs-article` renders in the single `var(--container-measure)` reading
 * column, and the layout deliberately has no wider track to opt into. The old
 * five-track grid's `lo-bleed` escape hatch let code blocks, callouts, steps,
 * tabs and tables render 6rem wider than the prose on each side
 * (fix/content-measure); a component that regains a wider placement silently
 * breaks the page's alignment, so the guard is on the rendered markup,
 * through the same Markdoc pipeline the content pages use.
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

describe("content measure", () => {
	it("renders a fenced code block in the measure", async () => {
		// A fence renders an async server component, which renderToStaticMarkup
		// cannot invoke inside the tree; calling it directly renders the same
		// component the pipeline mounts.
		const { CodeBlock } = await import("@/components/ui/code-block");
		const markup = renderToStaticMarkup(
			await CodeBlock({ code: "pip install local-operator", language: "bash" }),
		);
		expect(markup).toContain("lo-codeblock");
		expect(markup).not.toContain("lo-bleed");
	});

	it("keeps a callout in the measure", () => {
		const markup = renderSource(
			'{% callout type="note" %}Runtime needs Python 3.12.{% /callout %}',
		);
		expect(markup).toContain("Runtime needs Python 3.12.");
		expect(markup).not.toContain("lo-bleed");
	});

	it("keeps a table and its scroll region in the measure", () => {
		const markup = renderSource(
			"| Flag | Meaning |\n| --- | --- |\n| `--resume` | Resume a session. |\n",
		);
		expect(markup).toContain("<table");
		expect(markup).toContain("overflow-x-auto");
		expect(markup).not.toContain("lo-bleed");
	});

	it("keeps steps in the measure", () => {
		const markup = renderSource(
			'{% steps %}\n{% step title="Install" %}Run the installer.{% /step %}\n{% /steps %}',
		);
		expect(markup).toContain("lo-steps");
		expect(markup).not.toContain("lo-bleed");
	});

	it("keeps tab panels in the measure", () => {
		// Radix renders the strip in static markup and the panel bodies only
		// after hydration, so the strip is what this can pin — it is also the
		// element that carried the wider track.
		const markup = renderSource(
			'{% tabs %}\n{% tab label="macOS" %}brew install local-operator{% /tab %}\n{% /tabs %}',
		);
		expect(markup).toContain('role="tablist"');
		expect(markup).not.toContain("lo-bleed");
	});
});
