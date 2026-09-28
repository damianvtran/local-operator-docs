"use client";

import { useRouter } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { CHORDS } from "./chords";
import { SearchPalette } from "./search-palette";
import { ShortcutsDialog } from "./shortcuts-dialog";

/**
 * The site-wide keyboard layer: search palette, shortcuts overlay, and the
 * `g`-prefix navigation chords.
 *
 * One mount point owns every global key so the handlers cannot fight each
 * other, and one piece of state drives the palette so the trigger button,
 * the ⌘K key and the chords all open the same surface.
 *
 * Chords: press `g` then a letter — `g t` jumps to Terminal (TUI), `g d` to
 * the Desktop app, `g s` to the Python SDK, and so on. Targets resolve
 * through the availability list the server passes in, so a chord to a page
 * that does not exist yet says so instead of navigating into a 404.
 */
type SearchContextValue = {
	openPalette: () => void;
	openShortcuts: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch(): SearchContextValue {
	const value = useContext(SearchContext);
	if (!value) throw new Error("useSearch must be used inside <SearchProvider>");
	return value;
}

/** Chord map: key -> destination. `""` slug means the home page. */

function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return (
		tag === "INPUT" ||
		tag === "TEXTAREA" ||
		tag === "SELECT" ||
		target.isContentEditable
	);
}

export function SearchProvider({
	children,
	availableSlugs,
}: {
	children: ReactNode;
	availableSlugs: string[];
}) {
	const router = useRouter();
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [shortcutsOpen, setShortcutsOpen] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingChord = useRef(false);

	/**
	 * What had focus when each overlay opened, so closing hands it back. Radix
	 * restores focus to a DialogTrigger, and these overlays have no trigger:
	 * they open from the top-bar buttons, from `/` and ⌘K, from the footer,
	 * and from the palette itself (UX round 1, U5 — close used to drop focus
	 * to <body> and Tab restarted from the skip link).
	 */
	const paletteReturn = useRef<HTMLElement | null>(null);
	const shortcutsReturn = useRef<HTMLElement | null>(null);
	/** Mirrors `paletteOpen` for the key handler, which must know whether ⌘K
	 *  is opening (capture) or closing (do not capture) a fresh element. */
	const paletteOpenRef = useRef(false);

	useEffect(() => {
		paletteOpenRef.current = paletteOpen;
	}, [paletteOpen]);

	const rememberOverlayFocus = useCallback(
		(target: { current: HTMLElement | null }) => {
			const active = document.activeElement;
			target.current =
				active instanceof HTMLElement && active !== document.body
					? active
					: null;
		},
		[],
	);

	const available = useMemo(() => new Set(availableSlugs), [availableSlugs]);

	const showToast = useCallback((message: string) => {
		setToast(message);
	}, []);

	// Auto-dismiss the chord feedback.
	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => setToast(null), 2500);
		return () => clearTimeout(timer);
	}, [toast]);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const typing = isTypingTarget(event.target);

			// ⌘K / Ctrl+K: open the palette from anywhere, including fields —
			// toggling search while typing is the whole point of the shortcut.
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				if (!paletteOpenRef.current) rememberOverlayFocus(paletteReturn);
				setPaletteOpen(!paletteOpenRef.current);
				return;
			}
			if (typing) return;

			if (
				event.key === "/" &&
				!event.metaKey &&
				!event.ctrlKey &&
				!event.altKey
			) {
				event.preventDefault();
				rememberOverlayFocus(paletteReturn);
				setPaletteOpen(true);
				return;
			}

			if (event.key === "?") {
				event.preventDefault();
				rememberOverlayFocus(shortcutsReturn);
				setShortcutsOpen(true);
				return;
			}

			// Chord handling: g, then a target letter within 1.2s.
			if (pendingChord.current) {
				pendingChord.current = false;
				if (chordTimer.current) clearTimeout(chordTimer.current);
				const chord = CHORDS[event.key.toLowerCase()];
				if (chord) {
					event.preventDefault();
					if (chord.slug === "" || available.has(chord.slug)) {
						router.push(chord.slug === "" ? "/" : `/${chord.slug}`);
					} else {
						showToast(`${chord.label} is coming soon`);
					}
					return;
				}
			}

			if (
				event.key === "g" &&
				!event.metaKey &&
				!event.ctrlKey &&
				!event.altKey
			) {
				pendingChord.current = true;
				if (chordTimer.current) clearTimeout(chordTimer.current);
				chordTimer.current = setTimeout(() => {
					pendingChord.current = false;
				}, 1200);
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [available, router, showToast, rememberOverlayFocus]);

	const openPalette = useCallback(() => {
		rememberOverlayFocus(paletteReturn);
		setPaletteOpen(true);
	}, [rememberOverlayFocus]);

	const value = useMemo<SearchContextValue>(
		() => ({
			openPalette,
			openShortcuts: () => {
				rememberOverlayFocus(shortcutsReturn);
				setShortcutsOpen(true);
			},
		}),
		[openPalette, rememberOverlayFocus],
	);

	return (
		<SearchContext.Provider value={value}>
			{children}
			<SearchPalette
				open={paletteOpen}
				onOpenChange={setPaletteOpen}
				onOpenShortcuts={() => {
					setPaletteOpen(false);
					rememberOverlayFocus(shortcutsReturn);
					setShortcutsOpen(true);
				}}
				navigate={(href) => {
					setPaletteOpen(false);
					router.push(href);
				}}
				toast={showToast}
				returnFocus={() => paletteReturn.current}
			/>
			<ShortcutsDialog
				open={shortcutsOpen}
				onOpenChange={setShortcutsOpen}
				returnFocus={() =>
					// Opened from the palette, its own remembered control is the
					// palette's button, which is already unmounted — fall back to
					// whatever opened the palette.
					shortcutsReturn.current?.isConnected
						? shortcutsReturn.current
						: paletteReturn.current
				}
			/>
			{/* Chord feedback while a target is not navigable yet. */}
			<div
				role="status"
				aria-live="polite"
				className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
			>
				{toast ? (
					<span className="rounded-md border border-hairline bg-elevated px-3 py-2 text-body-sm text-ink shadow-overlay">
						{toast}
					</span>
				) : null}
			</div>
		</SearchContext.Provider>
	);
}
