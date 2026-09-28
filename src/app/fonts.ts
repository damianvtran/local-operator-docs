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
 *
 * The class must be applied to `<html>` (see layout.tsx), not `<body>`: the
 * mapping is declared at `:root`, and a var() reference is resolved where its
 * custom property is computed — at the root element. A body-scoped class
 * leaves `--font-mono` invalid for every element that inherits it, and the
 * whole site silently falls back to the sans stack while the webfont sits
 * built-but-unloaded (measured: round-1 D1/Q1).
 */
export const monoFont = GeistMono;
