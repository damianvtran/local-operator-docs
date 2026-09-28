/**
 * A small, strict frontmatter parser for `content/**\/*.md`.
 *
 * Why not a YAML dependency: the frontmatter contract here is a fixed, tiny
 * key set (`title`, `description`, `section`, `order`, `tags`, `draft`) with
 * string/number/boolean/list values. Strictness is a feature — a typo like
 * `descripton:` must fail the build with a line number, not silently produce
 * an empty metadata block the way a permissive parser would.
 */

export type FrontmatterValue = string | number | boolean | string[];

export type Frontmatter = {
	title?: string;
	description: string;
	section: string;
	order?: number;
	tags?: string[];
	draft?: boolean;
};

const KNOWN_KEYS = new Set([
	"title",
	"description",
	"section",
	"order",
	"tags",
	"draft",
]);

export class FrontmatterError extends Error {}

function parseValue(raw: string, line: number, file: string): FrontmatterValue {
	const value = raw.trim();
	if (value === "") {
		throw new FrontmatterError(`${file}:${line}: empty value`);
	}
	if (value.startsWith('"') || value.startsWith("'")) {
		const quote = value[0];
		if (!value.endsWith(quote) || value.length < 2) {
			throw new FrontmatterError(`${file}:${line}: unterminated quoted string`);
		}
		return value.slice(1, -1);
	}
	if (value.startsWith("[")) {
		if (!value.endsWith("]")) {
			throw new FrontmatterError(`${file}:${line}: unterminated list`);
		}
		return value
			.slice(1, -1)
			.split(",")
			.map((part) => part.trim().replace(/^["']|["']$/g, ""))
			.filter((part) => part.length > 0);
	}
	if (value === "true") return true;
	if (value === "false") return false;
	if (/^-?\d+$/.test(value)) return Number(value);
	return value;
}

/**
 * Splits `---`-delimited frontmatter from the markdown body.
 *
 * The file is expected to open with a `---` line; anything else is treated as
 * having no frontmatter so plain markdown (a README dropped into content/)
 * still renders. Validation happens in content.ts, which knows what a page
 * must declare — this function only parses.
 */
export function parseFrontmatter(
	source: string,
	file: string,
): { data: Partial<Frontmatter>; body: string } {
	const text = source.replace(/\r\n/g, "\n");
	if (!text.startsWith("---\n")) {
		return { data: {}, body: text };
	}
	const end = text.indexOf("\n---", 4);
	if (end === -1) {
		throw new FrontmatterError(`${file}: frontmatter opened but never closed`);
	}

	const block = text.slice(4, end);
	const body = text.slice(end + 4).replace(/^\n+/, "");
	const data: Record<string, FrontmatterValue> = {};

	block.split("\n").forEach((line, index) => {
		const lineNo = index + 2; // 1-based, +1 for the opening fence
		const trimmed = line.trim();
		if (trimmed === "" || trimmed.startsWith("#")) return;
		const colon = line.indexOf(":");
		if (colon === -1) {
			throw new FrontmatterError(
				`${file}:${lineNo}: expected "key: value", got ${JSON.stringify(line)}`,
			);
		}
		const key = line.slice(0, colon).trim();
		if (!KNOWN_KEYS.has(key)) {
			throw new FrontmatterError(
				`${file}:${lineNo}: unknown frontmatter key "${key}" (known: ${[...KNOWN_KEYS].join(", ")})`,
			);
		}
		if (key in data) {
			throw new FrontmatterError(`${file}:${lineNo}: duplicate key "${key}"`);
		}
		data[key] = parseValue(line.slice(colon + 1), lineNo, file);
	});

	return { data: data as Partial<Frontmatter>, body };
}
