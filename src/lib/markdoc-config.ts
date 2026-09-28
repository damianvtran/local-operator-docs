import Markdoc, {
	type Config,
	type Node as MarkdocNode,
} from "@markdoc/markdoc";
import type { ReactNode } from "react";
import * as React from "react";
import { Callout } from "@/components/ui/callout";
import { Card, Cards } from "@/components/ui/cards";
import { CodeBlock } from "@/components/ui/code-block";
import { Column, Columns } from "@/components/ui/columns";
import { CommandChip } from "@/components/ui/command-chip";
import { ContentTabs } from "@/components/ui/content-tabs";
import { Figure } from "@/components/ui/figure";
import { Kbd } from "@/components/ui/kbd";
import { markdownComponents } from "@/components/ui/markdown";
import { Step, Steps } from "@/components/ui/steps";
import type { TocEntry } from "@/lib/headings";
import { assignHeadingIds } from "@/lib/headings";

export type { TocEntry };
export { assignHeadingIds };

/**
 * Markdoc configuration: schema and the component map.
 *
 * Mirrors the radient-docs pipeline (same node set, same fence-to-CodeBlock
 * handoff) with the improvements the recon called out: frontmatter is real
 * (parsed in content.ts), heading ids are assigned once on the AST so the
 * TOC and the rendered headings cannot disagree, and the document node
 * renders as a fragment.
 *
 * `document.render = undefined` is load-bearing: Markdoc's default document
 * node wraps everything in its own <article>, which makes every element a
 * GRANDCHILD of `.docs-article` — the grid's `> *` track assignments and the
 * `* + *` rhythm silently match nothing, and the failure is visible only in
 * the rendered frame.
 */

const TabPanel = ({ children }: { children?: ReactNode }) =>
	// No JSX in this module: it is a .ts file (the render-name map lives here,
	// not a component library), so the fragment is spelled explicitly.
	React.createElement(React.Fragment, null, children);

export const markdocConfig: Config = {
	nodes: {
		document: { render: undefined },
		heading: {
			render: "Heading",
			attributes: {
				level: { type: Number, required: true },
				// Assigned by assignHeadingIds() on the AST before transform so ids
				// are deduplicated across the whole document and identical between
				// the TOC and the render.
				id: { type: String },
			},
		},
		paragraph: { render: "Paragraph" },
		blockquote: { render: "Blockquote" },
		list: {
			render: "List",
			transform(node, config) {
				const attributes = node.transformAttributes(config);
				attributes.isOrdered = node.attributes.ordered === true;
				return new Markdoc.Tag(
					"List",
					attributes,
					node.transformChildren(config),
				);
			},
		},
		item: { render: "ListItem" },
		code: {
			render: "Code",
			attributes: { content: { type: String, required: true, render: false } },
			transform(node) {
				return new Markdoc.Tag("Code", {}, [
					String(node.attributes.content ?? ""),
				]);
			},
		},
		fence: {
			render: "CodeBlock",
			attributes: {
				language: { type: String },
				content: { type: String, render: false, required: true },
			},
			transform(node) {
				// The fence's content lives in `node.attributes.content`; the tag's
				// children are just a trailing newline.
				return new Markdoc.Tag(
					"CodeBlock",
					{ language: node.attributes.language, code: node.attributes.content },
					[],
				);
			},
		},
		hr: { render: "Hr" },
		table: {
			render: "Table",
			// Stamped by assignHeadingIds() from the nearest preceding heading, so
			// each scrollable table region is named for its section.
			attributes: { section: { type: String, required: false } },
		},
		thead: { render: "TableHead" },
		tbody: { render: "TableBody" },
		tr: { render: "TableRow" },
		td: {
			render: "TableCell",
			transform(node, config) {
				const attributes = node.transformAttributes(config);
				return new Markdoc.Tag(
					"TableCell",
					attributes,
					node.transformChildren(config),
				);
			},
		},
		th: {
			render: "TableCell",
			transform(node, config) {
				const attributes = node.transformAttributes(config);
				attributes.isHeader = true;
				return new Markdoc.Tag(
					"TableCell",
					attributes,
					node.transformChildren(config),
				);
			},
		},
		em: { render: "Emphasis" },
		strong: { render: "Strong" },
		link: {
			render: "Link",
			attributes: { href: { type: String, required: true } },
		},
	},
	tags: {
		callout: {
			render: "Callout",
			attributes: { type: { type: String, required: true } },
		},
		steps: { render: "Steps" },
		step: {
			render: "Step",
			attributes: { title: { type: String } },
		},
		tabs: {
			render: "ContentTabs",
			transform(node, config) {
				// Labels come from the tab children's attributes; the panels
				// themselves render through the ContentTabs client component.
				const labels = (node.children ?? [])
					.filter((child) => child.type === "tag" && child.tag === "tab")
					.map((child) => String(child.attributes.label ?? "Tab"));
				return new Markdoc.Tag(
					"ContentTabs",
					{ labels },
					node.transformChildren(config),
				);
			},
		},
		tab: {
			render: "TabPanel",
			attributes: { label: { type: String, required: true } },
		},
		cards: { render: "Cards" },
		card: {
			render: "Card",
			attributes: {
				title: { type: String, required: true },
				href: { type: String, required: true },
				icon: { type: String },
			},
		},
		columns: { render: "Columns" },
		column: { render: "Column" },
		figure: {
			render: "Figure",
			attributes: {
				src: { type: String },
				alt: { type: String },
				caption: { type: String },
				frame: { type: Boolean },
			},
		},
		kbd: { render: "Kbd" },
		command: { render: "CommandChip" },
	},
};

/** The render-name -> component map passed to Markdoc's React renderer. */
export const markdocComponents = {
	...markdownComponents,
	CodeBlock,
	Callout,
	Steps,
	Step,
	ContentTabs,
	TabPanel,
	Cards,
	Card,
	Columns,
	Column,
	Figure,
	Kbd,
	CommandChip,
};

/** Transforms a validated page's AST into renderable content. */
export function transformDoc(ast: MarkdocNode) {
	return Markdoc.transform(ast, markdocConfig);
}

export function renderDoc(ast: MarkdocNode) {
	return Markdoc.renderers.react(transformDoc(ast), React, {
		components: markdocComponents,
	});
}
