import { describe, expect, it } from "vitest";
import {
	tokenizeCode,
	tokenizeQuery,
	tokenizeText,
} from "@/lib/search/tokenizer";

describe("tokenizeText", () => {
	it("folds diacritics and lowercases", () => {
		expect(tokenizeText("Über CAFÉ")).toEqual(["uber", "cafe"]);
	});

	it("splits on -, _, . and / and keeps the joined identifier", () => {
		const tokens = tokenizeText("local_operator.sdk");
		expect(tokens).toContain("local");
		expect(tokens).toContain("operator");
		expect(tokens).toContain("sdk");
		expect(tokens).toContain("localoperatorsdk");
	});

	it("keeps multi-word commands searchable as their parts", () => {
		expect(tokenizeText("run lop exec here")).toEqual([
			"run",
			"lop",
			"exec",
			"here",
		]);
	});

	it("drops stopwords from prose", () => {
		expect(tokenizeText("the to of and it")).toEqual([]);
	});

	it("applies stemmer-lite: plurals, ing and ed", () => {
		expect(tokenizeText("sessions")).toEqual(["session"]);
		expect(tokenizeText("policies")).toEqual(["policy"]);
		expect(tokenizeText("installing")).toEqual(["install"]);
		expect(tokenizeText("installed")).toEqual(["install"]);
		expect(tokenizeText("running")).toEqual(["run"]);
	});

	it("never maims protected words or identifiers", () => {
		expect(tokenizeText("status")).toEqual(["status"]);
		expect(tokenizeText("css")).toEqual(["css"]);
		expect(tokenizeText("series")).toEqual(["series"]);
		expect(tokenizeText("macos")).toEqual(["macos"]);
	});

	it("keeps digits and version parts", () => {
		expect(tokenizeText("Python 3.12")).toEqual(["python", "3", "12"]);
	});
});

describe("tokenizeCode", () => {
	it("keeps stopwords (they can be identifiers)", () => {
		expect(tokenizeCode("from")).toEqual(["from"]);
	});

	it("keeps identifiers intact and adds their parts", () => {
		const tokens = tokenizeCode("local_operator.sdk");
		expect(tokens).toContain("localoperatorsdk");
		expect(tokens).toContain("local");
		expect(tokens).toContain("operator");
		expect(tokens).toContain("sdk");
	});

	it("does not stem", () => {
		expect(tokenizeCode("sessions")).toEqual(["sessions"]);
	});
});

describe("tokenizeQuery", () => {
	it("matches the text tokenizer's contract", () => {
		expect(tokenizeQuery("Installing SEssions")).toEqual(
			tokenizeText("Installing SEssions"),
		);
	});
});
