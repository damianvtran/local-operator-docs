import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "@/lib/frontmatter";

describe("parseFrontmatter", () => {
	it("parses strings, numbers, booleans and lists", () => {
		const { data, body } = parseFrontmatter(
			"---\ndescription: A page\nsection: get-started\norder: 3\ntags: [a, b]\ndraft: true\n---\n\n# Title\n",
			"x.md",
		);
		expect(data.description).toBe("A page");
		expect(data.section).toBe("get-started");
		expect(data.order).toBe(3);
		expect(data.tags).toEqual(["a", "b"]);
		expect(data.draft).toBe(true);
		expect(body.startsWith("# Title")).toBe(true);
	});

	it("keeps quoted values whole", () => {
		const { data } = parseFrontmatter(
			'---\ndescription: "install: first run"\nsection: s\n---\n',
			"x.md",
		);
		expect(data.description).toBe("install: first run");
	});

	it("rejects unknown keys with a line number", () => {
		expect(() =>
			parseFrontmatter(
				"---\ndescription: x\nsection: s\nbogus: 1\n---\n",
				"x.md",
			),
		).toThrow(/bogus/);
	});

	it("rejects an unterminated block", () => {
		expect(() =>
			parseFrontmatter("---\ndescription: x\nsection: s\n", "x.md"),
		).toThrow(/never closed/);
	});

	it("treats a file without frontmatter as plain markdown", () => {
		const { data, body } = parseFrontmatter("# Just markdown\n", "x.md");
		expect(data).toEqual({});
		expect(body).toBe("# Just markdown\n");
	});
});
