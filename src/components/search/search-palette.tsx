"use client";

import { Clock, CornerDownLeft, Search } from "lucide-react";
import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { nearestPages, search } from "@/lib/search/engine";
import { tokenizeQuery } from "@/lib/search/tokenizer";
import type { ScoredEntry } from "@/lib/search/types";
import { cn } from "@/lib/utils";
import {
	actionMatches,
	actionMatchScore,
	buildActions,
	type PaletteAction,
} from "./actions";
import { renderMarked, renderRanges } from "./highlight";
import { useSearchIndex } from "./use-search-index";

/**
 * The command palette.
 *
 * Three layers of routing, in this order:
 *   1. ACTIONS — "Install Local Operator" copies the command, "Connect my
 *      phone" navigates, "Toggle theme" flips the theme. The palette is a
 *      router of intents, not only a search box.
 *   2. PAGES — whole-page hits.
 *   3. SECTIONS — h2/h3 hits deep-linked to their anchor.
 *
 * Mechanics that matter: results are local (one fetched index, ours to
 * score), so filtering is instant; the input debounces at 120ms only to keep
 * scoring off every keystroke frame; keyboard selection walks a single flat
 * list with Tab jumping group-to-group; every row is a real listbox option
 * with an id, so `aria-activedescendant` tracks the selection for screen
 * readers.
 */
const RECENT_KEY = "lop-docs:recent-searches";
const MAX_RECENT = 5;

const QUICK_LINKS = [
	{ title: "Install & first run", href: "/getting-started/install" },
	{ title: "Quickstart", href: "/getting-started/quickstart" },
	{
		title: "Choose your surface",
		href: "/getting-started/choose-your-surface",
	},
	{ title: "The terminal UI", href: "/tui/quickstart" },
];

type Row =
	| { kind: "action"; action: PaletteAction }
	| { kind: "recent"; query: string }
	| { kind: "link"; title: string; href: string }
	| { kind: "result"; result: ScoredEntry };

type RowGroup = { id: string; label: string; rows: Row[] };

/**
 * Stable per-row keys. Array indices are not identities here — the row set
 * reorders as the query changes, and index keys would let React reuse the
 * wrong row's DOM (stale hover state, stale refs).
 */
function rowKey(row: Row): string {
	switch (row.kind) {
		case "action":
			return `action-${row.action.id}`;
		case "recent":
			return `recent-${row.query}`;
		case "link":
			return `link-${row.href}`;
		case "result":
			return `result-${row.result.entry.id}`;
		default:
			return "row";
	}
}

function useDebounced<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
}

export function SearchPalette({
	open,
	onOpenChange,
	onOpenShortcuts,
	navigate,
	toast,
	returnFocus,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onOpenShortcuts: () => void;
	navigate: (href: string) => void;
	toast: (message: string) => void;
	/** The control the palette was opened from, so closing can give focus
	 *  back — Radix only restores it for a DialogTrigger, and this surface
	 *  has several doors and no trigger (UX round 1, U5). */
	returnFocus: () => HTMLElement | null;
}) {
	const [query, setQuery] = useState("");
	const [recents, setRecents] = useState<string[]>([]);
	const [selected, setSelected] = useState(0);
	const debounced = useDebounced(query, 120);
	const { state, retry } = useSearchIndex(open);
	const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const [listOverflows, setListOverflows] = useState(false);
	const listObserver = useRef<ResizeObserver | null>(null);

	/**
	 * The fold's answer, MEASURED from the elements: the content's height
	 * against the scroller's box, the container's own padding included
	 * because it scrolls with the content. `scrollHeight` cannot be the
	 * input — the end spacer below would feed back into its own condition —
	 * so the spacer sits outside the measured wrapper. A callback ref rather
	 * than an effect: Radix defers the portal by one commit, so an effect
	 * keyed on `open` runs before the nodes exist and never re-runs. Both
	 * cuts are recorded in local-operator-ui docs/command-palette.md, whose
	 * "the list fades at the fold, and only when there is a fold" this
	 * implements (design round 1, D2).
	 */
	const observeList = useCallback((node: HTMLDivElement | null) => {
		listObserver.current?.disconnect();
		if (!node?.parentElement) return;
		const list = node.parentElement;
		const measure = () => {
			const styles = getComputedStyle(list);
			const padding =
				Number.parseFloat(styles.paddingTop) +
				Number.parseFloat(styles.paddingBottom);
			setListOverflows(node.offsetHeight + padding > list.clientHeight + 1);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(list);
		observer.observe(node);
		listObserver.current = observer;
	}, []);

	useEffect(() => () => listObserver.current?.disconnect(), []);

	// Load recent searches when the palette opens; clear the query on close.
	useEffect(() => {
		if (!open) {
			setQuery("");
			return;
		}
		try {
			const stored = window.localStorage.getItem(RECENT_KEY);
			const parsed: unknown = stored ? JSON.parse(stored) : [];
			setRecents(
				Array.isArray(parsed)
					? parsed.filter((x): x is string => typeof x === "string")
					: [],
			);
		} catch {
			setRecents([]);
		}
	}, [open]);

	function recordRecent(value: string) {
		const trimmed = value.trim();
		if (!trimmed || trimmed.length < 2) return;
		const next = [trimmed, ...recents.filter((item) => item !== trimmed)].slice(
			0,
			MAX_RECENT,
		);
		setRecents(next);
		try {
			window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
		} catch {
			// Sessions in private mode just do not get recents.
		}
	}

	const actions = useMemo(
		() =>
			buildActions({
				navigate,
				copy: async (text) => {
					try {
						await navigator.clipboard.writeText(text);
						return true;
					} catch {
						return false;
					}
				},
				toast,
				openShortcuts: onOpenShortcuts,
			}),
		[navigate, toast, onOpenShortcuts],
	);

	const index = state.status === "ready" ? state.index : null;
	const queryTokens = useMemo(() => tokenizeQuery(debounced), [debounced]);

	const results = useMemo(
		() => (index && debounced.trim() ? search(index, debounced, 40) : []),
		[index, debounced],
	);

	const groups = useMemo<RowGroup[]>(() => {
		const out: RowGroup[] = [];
		const trimmed = debounced.trim();

		if (!trimmed) {
			out.push({
				id: "actions",
				label: "Actions",
				rows: actions.map((action) => ({ kind: "action", action })),
			});
			if (recents.length > 0) {
				out.push({
					id: "recent",
					label: "Recent searches",
					rows: recents.map((item) => ({ kind: "recent", query: item })),
				});
			}
			out.push({
				id: "pages",
				label: "Pages",
				rows: QUICK_LINKS.map((link) => ({ kind: "link", ...link })),
			});
			return out;
		}

		// Strict matches first, near misses after: a natural question keeps
		// one word the action vocabulary does not have, and that partial fit
		// must never outrank an action the query names exactly (UX U2).
		const matchedActions = actions
			.map((action) => ({
				action,
				matched: actionMatchScore(action, queryTokens),
			}))
			.filter(({ action }) => actionMatches(action, queryTokens))
			.sort((a, b) => b.matched - a.matched)
			.map(({ action }) => action);
		if (matchedActions.length > 0) {
			out.push({
				id: "actions",
				label: "Actions",
				rows: matchedActions.map((action) => ({ kind: "action", action })),
			});
		}
		const pages = results
			.filter((result) => result.entry.kind === "page")
			.slice(0, 6);
		if (pages.length > 0) {
			out.push({
				id: "pages",
				label: "Pages",
				rows: pages.map((result) => ({ kind: "result", result })),
			});
		}
		const sections = results
			.filter((result) => result.entry.kind === "section")
			.slice(0, 12);
		if (sections.length > 0) {
			out.push({
				id: "sections",
				label: "Sections",
				rows: sections.map((result) => ({ kind: "result", result })),
			});
		}
		if (pages.length === 0 && sections.length === 0 && index) {
			const nearest = nearestPages(index, debounced, 3);
			if (nearest.length > 0) {
				out.push({
					id: "nearest",
					label: "Nearest pages",
					rows: nearest.map((result) => ({ kind: "result", result })),
				});
			}
		}
		return out;
	}, [actions, debounced, index, queryTokens, recents, results]);

	const flat = useMemo(
		() =>
			groups.flatMap((group, groupIndex) =>
				group.rows.map((row, rowIndex) => ({
					row,
					group: groupIndex,
					rowIndex,
				})),
			),
		[groups],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: resetting on a new query is the point
	useEffect(() => setSelected(0), [debounced]);
	useEffect(() => {
		setSelected((current) =>
			flat.length === 0 ? 0 : Math.min(current, flat.length - 1),
		);
	}, [flat.length]);
	useEffect(() => {
		rowRefs.current[selected]?.scrollIntoView({ block: "nearest" });
	}, [selected]);

	function activate(row: Row) {
		switch (row.kind) {
			case "action":
				recordRecent(query);
				row.action.run();
				break;
			case "recent":
				setQuery(row.query);
				break;
			case "link":
				recordRecent(query);
				navigate(row.href);
				break;
			case "result":
				recordRecent(query);
				navigate(row.result.entry.url);
				break;
		}
	}

	function move(delta: number) {
		if (flat.length === 0) return;
		setSelected((current) => (current + delta + flat.length) % flat.length);
	}

	function moveGroup(delta: number) {
		const current = flat[selected];
		if (!current || groups.length === 0) return;
		for (let step = 1; step <= groups.length; step++) {
			const candidate =
				(((current.group + delta * step) % groups.length) + groups.length) %
				groups.length;
			const first = flat.findIndex((item) => item.group === candidate);
			if (first !== -1) {
				setSelected(first);
				return;
			}
		}
	}

	function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			move(1);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			move(-1);
		} else if (event.key === "Tab") {
			event.preventDefault();
			moveGroup(event.shiftKey ? -1 : 1);
		} else if (event.key === "Enter") {
			event.preventDefault();
			const target = flat[selected];
			if (target) activate(target.row);
		}
	}

	const trimmedQuery = debounced.trim();
	const shortQuery = trimmedQuery.length > 0 && trimmedQuery.length < 3;
	// The empty state counts ROWS, not index results: with action rows on
	// screen "No results" contradicted the list under it, and under three
	// characters the index cannot answer yet — that state is "keep typing",
	// not "nothing found" (UX round 1, U7).
	const noResults =
		Boolean(index) && !shortQuery && trimmedQuery !== "" && flat.length === 0;
	const showKeepTyping = Boolean(index) && shortQuery && flat.length === 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="top-[12vh] p-0"
				aria-describedby={undefined}
				onCloseAutoFocus={(event) => {
					// Radix restores focus to a DialogTrigger; there is none here
					// (several doors, no trigger), so the provider's remembered
					// control takes it back (UX round 1, U5).
					const target = returnFocus();
					if (target?.isConnected) {
						event.preventDefault();
						target.focus();
					}
				}}
			>
				<DialogTitle className="sr-only">Search the docs</DialogTitle>
				<div className="flex items-center gap-2 border-b border-hairline px-3">
					<Search className="size-4 shrink-0 text-ink-dim" aria-hidden="true" />
					<input
						autoFocus
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						onKeyDown={onKeyDown}
						placeholder="Search docs or run a command…"
						role="combobox"
						aria-expanded="true"
						aria-controls="palette-list"
						aria-activedescendant={
							flat.length > 0 ? `palette-row-${selected}` : undefined
						}
						aria-label="Search the docs"
						className="h-11 w-full bg-transparent text-body text-ink placeholder:text-ink-disabled"
					/>
					<Kbd className="shrink-0">esc</Kbd>
				</div>

				<span role="status" aria-live="polite" className="sr-only">
					{state.status === "loading"
						? "Searching…"
						: trimmedQuery
							? shortQuery
								? "Keep typing — results start at three characters"
								: flat.length === 0
									? "No results"
									: `${flat.length} results`
							: ""}
				</span>

				{/* The list, and the fold. The wrapper is `relative` so the fade can
				    be an OVERLAY — a sticky in-flow element would occupy layout and
				    change every list that fits its content. The overlay and the end
				    spacer (room for the last row to clear the fade) render only when
				    the content actually overflows, measured in `observeList`. */}
				<div className="relative">
					{listOverflows ? (
						<div
							aria-hidden="true"
							className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-linear-to-t from-elevated to-transparent"
						/>
					) : null}
					<div
						id="palette-list"
						role="listbox"
						aria-label="Results"
						className="max-h-[60vh] overflow-y-auto p-2"
					>
						{/* The measured half: everything the scrollbar actually scrolls. */}
						<div ref={observeList} role="presentation">
							{state.status === "loading" ? (
								<div className="flex h-24 items-center justify-center text-body-sm text-ink-dim">
									<span className="animate-pulse-visible">
										Building the search index…
									</span>
								</div>
							) : null}

							{state.status === "error" ? (
								<div className="flex h-24 flex-col items-center justify-center gap-2 text-body-sm text-ink-dim">
									<p className="text-danger">{state.message}</p>
									<p>{state.hint}</p>
									<button
										type="button"
										onClick={retry}
										className="rounded-sm border border-control px-3 py-1 text-body-sm text-ink hover:bg-surface"
									>
										Retry
									</button>
								</div>
							) : null}

							{noResults ? (
								<div className="flex flex-col items-center gap-1 px-4 py-6 text-body-sm text-ink-dim">
									<p className="text-ink-muted">
										No results for “{trimmedQuery}”.
									</p>
									<p>Try fewer or shorter words.</p>
								</div>
							) : null}

							{showKeepTyping ? (
								<div className="flex flex-col items-center gap-1 px-4 py-6 text-body-sm text-ink-dim">
									<p className="text-ink-muted">
										Keep typing — results start at three characters.
									</p>
								</div>
							) : null}

							{state.status === "ready"
								? groups.map((group, groupIndex) => (
										// biome-ignore lint/a11y/useSemanticElements: role="group" is the ARIA pattern for grouped listbox options; no native element can sit inside a listbox
										<div
											key={group.id}
											role="group"
											aria-label={group.label}
											className="mb-1 last:mb-0"
										>
											<div className="px-2 pb-1 pt-2 text-meta font-semibold uppercase tracking-wider text-ink-dim">
												{group.label}
											</div>
											{group.rows.map((row, rowIndex) => {
												const flatIndex = flat.findIndex(
													(item) =>
														item.group === groupIndex &&
														item.rowIndex === rowIndex,
												);
												const isSelected = flatIndex === selected;
												return (
													<button
														key={rowKey(row)}
														ref={(element) => {
															rowRefs.current[flatIndex] = element;
														}}
														type="button"
														role="option"
														id={`palette-row-${flatIndex}`}
														aria-selected={isSelected}
														onMouseEnter={() => setSelected(flatIndex)}
														onClick={() => activate(row)}
														className={cn(
															"flex min-h-14 w-full items-center gap-3 rounded-sm px-3 py-2 text-left",
															isSelected ? "bg-surface" : "bg-transparent",
														)}
													>
														{row.kind === "action" ? (
															<>
																<row.action.icon
																	className="size-4 shrink-0 text-ink-muted"
																	aria-hidden="true"
																/>
																<span className="min-w-0 flex-1">
																	<span className="block text-body font-medium text-ink">
																		{row.action.title}
																	</span>
																	<span className="block truncate text-body-sm text-ink-muted">
																		{row.action.subtitle}
																	</span>
																</span>
																{isSelected ? (
																	<CornerDownLeft
																		className="size-3.5 shrink-0 text-ink-dim"
																		aria-hidden="true"
																	/>
																) : null}
															</>
														) : null}

														{row.kind === "recent" ? (
															<>
																<Clock
																	className="size-4 shrink-0 text-ink-muted"
																	aria-hidden="true"
																/>
																<span className="min-w-0 flex-1 text-body text-ink">
																	{row.query}
																</span>
															</>
														) : null}

														{row.kind === "link" ? (
															<span className="min-w-0 flex-1">
																<span className="block text-body text-ink">
																	{row.title}
																</span>
																<span className="block truncate font-mono text-mono-sm text-ink-dim">
																	{row.href}
																</span>
															</span>
														) : null}

														{row.kind === "result" ? (
															<span className="min-w-0 flex-1">
																<span className="flex items-baseline gap-2 text-body text-ink">
																	<span className="truncate font-medium">
																		{renderRanges(
																			row.result.entry.title,
																			row.result.titleRanges,
																		)}
																	</span>
																	{row.result.entry.kind === "section" &&
																	row.result.entry.heading ? (
																		<>
																			<span className="shrink-0 text-ink-dim">
																				›
																			</span>
																			<span className="truncate">
																				{renderRanges(
																					row.result.entry.heading,
																					row.result.headingRanges,
																				)}
																			</span>
																		</>
																	) : null}
																	{row.result.entry.draft ? (
																		<span className="shrink-0 rounded-xs border border-hairline px-1 py-0.5 font-mono text-mono-sm text-ink-dim">
																			Preview
																		</span>
																	) : null}
																</span>
																{row.result.snippet ? (
																	<span className="mt-0.5 line-clamp-2 block text-body-sm text-ink-muted">
																		{renderMarked(row.result.snippet)}
																	</span>
																) : null}
																<span className="mt-0.5 block font-mono text-mono-sm text-ink-dim">
																	{row.result.entry.breadcrumb}
																</span>
															</span>
														) : null}
													</button>
												);
											})}
										</div>
									))
								: null}
						</div>
						{/* The end spacer: room to scroll the last row clear of the fade.
						    Only when the list overflows, and OUTSIDE the measured wrapper
						    so its own height cannot feed back into that answer. */}
						{listOverflows ? <div aria-hidden="true" className="h-6" /> : null}
					</div>
				</div>

				<div className="flex items-center gap-3 border-t border-hairline px-3 py-2 text-mono-sm text-ink-dim">
					<span className="flex items-center gap-1">
						<Kbd>↑</Kbd>
						<Kbd>↓</Kbd> navigate
					</span>
					<span className="flex items-center gap-1">
						<Kbd>tab</Kbd> groups
					</span>
					<span className="flex items-center gap-1">
						<Kbd>↵</Kbd> open
					</span>
					<button
						type="button"
						onClick={onOpenShortcuts}
						className="ml-auto rounded-xs border border-hairline px-2 py-0.5 font-mono transition-colors duration-fast hover:border-control hover:text-ink"
					>
						? shortcuts
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
