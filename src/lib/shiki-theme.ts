import type { ThemeRegistration } from "shiki";

/**
 * Syntax themes for the dual light/dark code blocks.
 *
 * Every value is a palette token from palettes.css, not an invented colour —
 * the code block must look like the app, and the app's floors were calibrated
 * for these values. Comments stay upright (no italics anywhere): the design
 * language reserves the faces for structure, not emphasis.
 *
 * Two themes, chosen at render time by the CSS in globals.css: Shiki emits
 * BOTH palettes as custom properties on the markup (`defaultColor: false`),
 * and the `data-theme` attribute on <html> picks one. That is the whole
 * light/dark code strategy — no client re-highlighting, no second render.
 */

export const loDark: ThemeRegistration = {
	name: "lo-dark",
	type: "dark",
	colors: {
		"editor.background": "#0f0c08", // sunken
		"editor.foreground": "#f1eee6", // ink
	},
	settings: [
		{
			scope: ["comment", "punctuation.definition.comment"],
			settings: { foreground: "#918b7d" },
		}, // ink-dim
		{
			scope: ["string", "string.quoted", "punctuation.definition.string"],
			settings: { foreground: "#e0b04b" },
		}, // warning
		{
			scope: ["constant.numeric", "constant.language", "constant.character"],
			settings: { foreground: "#57c785" },
		}, // success
		{
			scope: [
				"keyword",
				"storage",
				"keyword.control",
				"storage.type",
				"storage.modifier",
			],
			settings: { foreground: "#86b3f2" },
		}, // info
		{
			scope: [
				"entity.name.function",
				"support.function",
				"meta.function-call",
				"entity.name.function.member",
			],
			settings: { foreground: "#38c96a" },
		}, // accent
		{
			scope: [
				"entity.name.type",
				"entity.name.class",
				"support.class",
				"support.type",
				"entity.other.inherited-class",
			],
			settings: { foreground: "#5ad584" },
		}, // accent-hover
		{
			scope: [
				"variable",
				"variable.other",
				"meta.object-literal.key",
				"variable.parameter",
			],
			settings: { foreground: "#f1eee6" },
		}, // ink
		{
			scope: ["entity.name.tag", "support.type.property-name"],
			settings: { foreground: "#86b3f2" },
		}, // info
		{
			scope: [
				"keyword.operator",
				"punctuation",
				"meta.brace",
				"punctuation.separator",
			],
			settings: { foreground: "#b5afa2" },
		}, // ink-muted
		{
			scope: ["string.regexp", "invalid"],
			settings: { foreground: "#ef8078" },
		}, // danger
	],
};

export const loLight: ThemeRegistration = {
	name: "lo-light",
	type: "light",
	colors: {
		"editor.background": "#efe9db", // sunken
		"editor.foreground": "#211e18", // ink
	},
	settings: [
		{
			scope: ["comment", "punctuation.definition.comment"],
			settings: { foreground: "#6c675c" },
		}, // ink-dim
		{
			scope: ["string", "string.quoted", "punctuation.definition.string"],
			settings: { foreground: "#8a5800" },
		}, // warning
		{
			scope: ["constant.numeric", "constant.language", "constant.character"],
			settings: { foreground: "#1a774a" },
		}, // success
		{
			scope: [
				"keyword",
				"storage",
				"keyword.control",
				"storage.type",
				"storage.modifier",
			],
			settings: { foreground: "#2368a8" },
		}, // info
		{
			scope: [
				"entity.name.function",
				"support.function",
				"meta.function-call",
				"entity.name.function.member",
			],
			settings: { foreground: "#147842" },
		}, // accent
		{
			scope: [
				"entity.name.type",
				"entity.name.class",
				"support.class",
				"support.type",
				"entity.other.inherited-class",
			],
			settings: { foreground: "#116036" },
		}, // accent-hover
		{
			scope: [
				"variable",
				"variable.other",
				"meta.object-literal.key",
				"variable.parameter",
			],
			settings: { foreground: "#211e18" },
		}, // ink
		{
			scope: ["entity.name.tag", "support.type.property-name"],
			settings: { foreground: "#2368a8" },
		}, // info
		{
			scope: [
				"keyword.operator",
				"punctuation",
				"meta.brace",
				"punctuation.separator",
			],
			settings: { foreground: "#565147" },
		}, // ink-muted
		{
			scope: ["string.regexp", "invalid"],
			settings: { foreground: "#b23a31" },
		}, // danger
	],
};
