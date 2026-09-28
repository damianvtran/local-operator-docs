import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests run against the pure library layer (search engine, nav/content
 * derivation) with no DOM: everything under test reads files and strings,
 * plus the diagram components and the Markdoc pipeline, which render through
 * `react-dom/server`.
 *
 * `oxc.jsx = automatic` is load-bearing: tsconfig keeps `jsx: preserve`
 * for Next's compiler, so without this override Vitest hands JSX straight to
 * Node and every .tsx import fails to parse.
 */
export default defineConfig({
	oxc: { jsx: { runtime: "automatic" } },
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
	},
});
