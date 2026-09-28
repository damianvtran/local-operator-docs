import { GeistMono } from "geist/font/mono";

/**
 * Fonts.
 *
 * Sans is deliberately the OS UI font — the app's own decision, restated
 * here: bundling a webfont to change the platform's UI face adds weight for
 * nothing. Mono is the app's machine voice (Geist Mono), shipped as a real
 * webfont through next/font so it is self-hosted, preloaded, and available to
 * `<pre>` blocks on first paint.
 *
 * `GeistMono.variable` publishes `--font-geist-mono`, which globals.css maps
 * into `--font-mono` ahead of the system fallbacks.
 */
export const monoFont = GeistMono;
