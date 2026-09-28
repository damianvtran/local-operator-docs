/**
 * The `g`-prefix navigation chords, shared by the provider (which executes
 * them) and the shortcuts overlay (which documents them). One list, so the
 * documentation of a chord cannot drift from the chord.
 */
export const CHORDS: Record<string, { slug: string; label: string }> = {
	h: { slug: "", label: "Home" },
	i: { slug: "getting-started/install", label: "Install & first run" },
	q: { slug: "getting-started/quickstart", label: "Quickstart" },
	u: { slug: "getting-started/updating", label: "Updating" },
	c: {
		slug: "getting-started/choose-your-surface",
		label: "Choose your surface",
	},
	t: { slug: "tui/quickstart", label: "Terminal (TUI)" },
	d: { slug: "surfaces/desktop", label: "Desktop app" },
	m: { slug: "surfaces/mobile-relay", label: "Mobile relay" },
	s: { slug: "build/python-sdk", label: "Python SDK" },
	e: { slug: "build/exec-mode", label: "Exec mode" },
};

export const CHORD_LIST = Object.entries(CHORDS).map(([key, value]) => ({
	key,
	...value,
}));
