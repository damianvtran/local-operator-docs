// A dependency-free Chrome driver: find a binary, launch it headless, and talk
// CDP over the one socket it prints on startup.
//
// WHY IT EXISTS. `scripts/generate-og-images.mjs` renders 17 share cards from
// the live site, and that means driving a real browser: reading each page's
// DOM for the strings and colours a card is painted with, then rasterising a
// composed document. Nothing in this repo may install a browser engine to do
// it — Playwright and Puppeteer are not in the tree and adding either means a
// ~170 MB browser download in the deploy image. Node has had a WebSocket
// client since v22 (the engine floor in package.json is 22.13.1) and CDP is
// JSON over one socket, so the whole driver is the file below.
//
// WHAT IT IS NOT. A general-purpose automation layer: no navigation helpers
// beyond `navigate`, no selectors, no waiting policies. The one caller reads
// pages and screenshots documents; this exposes exactly that and nothing more.
//
// The launcher flags are deliberately conservative. `--use-mock-keychain` and
// `--password-store=basic` keep a throwaway profile from ever asking the host
// secret store for anything (a headless run must be non-interactive, and on a
// developer machine a fresh profile otherwise prompts to create a login
// keychain); `--hide-scrollbars` because a headless Linux runner measures
// scrollbars into the layout where macOS does not, and the cards must render
// the same on both. A caller with a pinned binary sets `CHROME_PATH`.

import { spawn } from "node:child_process";
import {
	existsSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Every shape a Playwright download takes, on the two hosts this runs on.
 * `readdirSync` rather than a glob: the cache is one directory deep.
 */
function expandPlaywrightCache(cache) {
	const out = [];
	for (const entry of readdirSync(cache)) {
		if (entry.startsWith("chromium_headless_shell-")) {
			out.push(
				join(
					cache,
					entry,
					"chrome-headless-shell-mac-arm64/chrome-headless-shell",
				),
				join(cache, entry, "chrome-headless-shell-linux/chrome-headless-shell"),
			);
		}
		if (entry.startsWith("chromium-")) {
			out.push(
				join(
					cache,
					entry,
					"chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
				),
				join(cache, entry, "chrome-linux/chrome"),
			);
		}
	}
	return out;
}

/**
 * The first Chrome-family binary on this host, or `undefined`.
 *
 * An explicit `CHROME_PATH` always wins, so a caller pinning a specific build
 * — which is what makes two hosts render the same pixels — needs no code
 * change. Returning `undefined` rather than throwing keeps the "no browser"
 * decision with the caller, whose message can say what to install.
 */
export function findChrome() {
	const explicit =
		process.env.CHROME_PATH ??
		process.env.CHROME_BIN ??
		process.env.PUPPETEER_EXECUTABLE_PATH;
	if (explicit) return explicit;

	const home = process.env.HOME ?? "";
	const candidates = [
		...(existsSync(join(home, "Library/Caches/ms-playwright"))
			? expandPlaywrightCache(join(home, "Library/Caches/ms-playwright"))
			: []),
		...(existsSync(join(home, ".cache/ms-playwright"))
			? expandPlaywrightCache(join(home, ".cache/ms-playwright"))
			: []),
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"/Applications/Chromium.app/Contents/MacOS/Chromium",
		"/usr/bin/google-chrome",
		"/usr/bin/chromium",
		"/usr/bin/chromium-browser",
	];
	return candidates.find((path) => existsSync(path));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Launch `chromePath` headless and return `{ send, socket, close }`.
 *
 * The port is asked for as `0` and read back from `DevToolsActivePort` in the
 * profile directory: a fixed port is a port that is sometimes taken, and the
 * stack trace that produces is worse than the retry loop below. `socket` is
 * the raw WebSocket, there for `openPage`'s load-event listener; `send` is
 * the request/response half, with `sessionId` targeting a page.
 */
export async function launchChrome(chromePath, { windowSize } = {}) {
	const profile = mkdtempSync(join(tmpdir(), "lo-docs-chrome-"));
	const chrome = spawn(
		chromePath,
		[
			"--headless=new",
			"--remote-debugging-port=0",
			`--user-data-dir=${profile}`,
			...(windowSize
				? [`--window-size=${windowSize.width},${windowSize.height}`]
				: []),
			"--hide-scrollbars",
			"--disable-gpu",
			"--force-color-profile=srgb",
			"--use-mock-keychain",
			"--password-store=basic",
			"--no-first-run",
			"--no-default-browser-check",
			"about:blank",
		],
		{ stdio: "ignore" },
	);

	let wsUrl = null;
	for (let i = 0; i < 200 && !wsUrl; i++) {
		try {
			// `DevToolsActivePort` is two lines: the port, then the browser's
			// ws path. The PORT is line one — reading the second line here is
			// how this driver once tried to dial `127.0.0.1:80`. Chrome creates
			// the file EMPTY before filling it, so an empty read counts as
			// "not yet" and must still sleep; without that this loop burns all
			// its iterations in microseconds and gives up on a healthy browser.
			const text = readFileSync(join(profile, "DevToolsActivePort"), "utf8");
			const [port] = text.trim().split("\n");
			if (port) wsUrl = `ws://127.0.0.1:${port}`;
		} catch {
			// Not written yet.
		}
		if (!wsUrl) await sleep(100);
	}
	if (!wsUrl) {
		chrome.kill("SIGKILL");
		throw new Error(
			"Chrome never printed a DevTools port; is it really Chrome?",
		);
	}

	const version = await (
		await fetch(`http://${wsUrl.slice(5)}/json/version`)
	).json();
	const socket = new WebSocket(version.webSocketDebuggerUrl);
	await new Promise((resolve, reject) => {
		socket.onopen = resolve;
		socket.onerror = reject;
	});

	let seq = 0;
	const pending = new Map();
	socket.onmessage = (event) => {
		const message = JSON.parse(event.data);
		if (message.id && pending.has(message.id)) {
			const { resolve, reject } = pending.get(message.id);
			pending.delete(message.id);
			if (message.error) reject(new Error(JSON.stringify(message.error)));
			else resolve(message.result);
		}
	};

	const send = (method, params = {}, sessionId) =>
		new Promise((resolve, reject) => {
			const id = ++seq;
			pending.set(id, { resolve, reject });
			socket.send(JSON.stringify({ id, method, params, sessionId }));
		});

	return {
		send,
		socket,
		async close() {
			try {
				await send("Browser.close");
			} catch {
				// The socket drops as the browser exits; the kill below is the
				// belt to this braces either way.
			}
			chrome.kill("SIGKILL");
			await sleep(250);
			rmSync(profile, { recursive: true, force: true });
		},
	};
}

/**
 * Attach a fresh page target and return session-bound helpers.
 *
 * `flatten: true` keeps every page riding the one browser socket, so a second
 * page costs one `Target.createTarget` and no second connection. `navigate`
 * resolves on the load event with a 15 s cap — a page that never fires it is a
 * failure the caller can see, not a hang.
 */
export async function openPage(browser) {
	const { targetId } = await browser.send("Target.createTarget", {
		url: "about:blank",
	});
	const { sessionId } = await browser.send("Target.attachToTarget", {
		targetId,
		flatten: true,
	});
	await browser.send("Page.enable", {}, sessionId);
	await browser.send("Runtime.enable", {}, sessionId);

	const evaluate = async (expression, awaitPromise = false) => {
		const result = await browser.send(
			"Runtime.evaluate",
			{ expression, awaitPromise, returnByValue: true },
			sessionId,
		);
		if (result.exceptionDetails) {
			throw new Error(
				result.exceptionDetails.exception?.description ??
					result.exceptionDetails.text,
			);
		}
		return result.result?.value;
	};

	const navigate = async (url) => {
		const loaded = new Promise((resolve) => {
			const timer = setTimeout(resolve, 15000);
			const onMessage = (event) => {
				const message = JSON.parse(event.data);
				if (message.method === "Page.loadEventFired") {
					clearTimeout(timer);
					browser.socket.removeEventListener("message", onMessage);
					resolve();
				}
			};
			browser.socket.addEventListener("message", onMessage);
		});
		await browser.send("Page.navigate", { url }, sessionId);
		await loaded;
	};

	return { sessionId, evaluate, navigate };
}

/**
 * Wait until the document is quiet enough to read: fonts resolved, then two
 * animation frames so anything that lays out on rAF has run. Deterministic
 * ordering beats a fixed sleep, which is either slow or flaky.
 */
export async function settle(evaluate) {
	await evaluate("document.fonts.ready.then(() => true)", true).catch(() => {});
	await evaluate(
		`new Promise((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
		})`,
		true,
	);
}
