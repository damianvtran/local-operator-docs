import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

// Assert on the actual homepage output: testing the component in isolation
// would also pass if the hero quietly went back to a screenshot.
const html = renderToStaticMarkup(createElement(HomePage));
const hero = html.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/)?.[0] ?? "";

function list(label: string) {
	return (
		hero.match(
			new RegExp(`<ul aria-label="${label}"[^>]*>[\\s\\S]*?<\\/ul>`),
		)?.[0] ?? ""
	);
}

describe("homepage team-run hero", () => {
	it("labels the example and does not expose the app chrome as controls", () => {
		expect(hero).toContain('aria-labelledby="team-run-caption"');
		expect(hero).toMatch(
			/<figcaption id="team-run-caption"[^>]*>Illustrated example:/,
		);
		expect(hero).not.toMatch(
			/<(?:img|input|textarea|select|button|a)\b|\b(?:tabindex|aria-live|contenteditable)=/i,
		);
		expect(hero).not.toMatch(
			/\brole="(?:button|tab|textbox|status|alert|link|listbox)"/i,
		);
	});

	it("shows the active conversation and identifies the selected team", () => {
		expect(list("Open conversations")).toMatch(
			/Checkout recovery<span[^>]*> \(active\)<\/span>/,
		);
		expect(list("Open conversations")).toContain("Release notes");
		expect(list("Teams")).toMatch(
			/Product team<span[^>]*> \(selected\)<\/span>/,
		);
		expect(list("Teams")).toContain("Docs team");
		expect(list("Agents")).toContain("Manager");
		expect(hero).toContain("Keep entered details if payment fails.");
		expect(hero).toContain("A declined payment resets the entire form.");
		expect(hero).toContain("your approval before merging");
	});

	it("pairs the three roster roles with distinct in-flight work", () => {
		const jobs = list("Subagents").match(/<li\b[^>]*>[\s\S]*?<\/li>/g) ?? [];
		expect(jobs).toHaveLength(3);
		for (const [role, status, task] of [
			["UX Reviewer", "Testing", "using only the keyboard"],
			["Designer", "Mapping states", "show where to retry"],
			["Coder", "Implementing", "Keep contact and shipping details"],
		]) {
			expect(list("Agents")).toContain(role);
			const job = jobs.find((row) => row.includes(role));
			expect(job).toContain(status);
			expect(job).toContain(task);
		}
	});
});
