// The card template's version, shared by the generator and the drift check.
//
// WHY A VERSION AT ALL, when the template is right there in the generator.
// A card's identity — its filename hash and its recorded fingerprint — is
// computed from what the card was made of: the page strings it reads plus this
// number. The pixels themselves cannot carry that identity: Chrome's glyph
// rasterisation varies by a handful of ±1 anti-aliasing bytes across launches
// (measured: two renders of one card differed in 8 of 2.27M raw bytes after
// the 2x downsample), so hashing the PNG's bytes would rename every card on
// every regeneration and invalidate every unfurl for no visible change.
//
// Hashing the INPUTS instead makes the name stable for stable content, which
// then lets the generator skip rendering a card that already exists — the
// property that keeps `pnpm og` cheap and the committed set quiet.
//
// So: bump this when the template (layout, type, tokens, composition) changes
// in a way that should re-address every card, and the next `pnpm og` renders
// all of them under new names. The drift check compares page STRINGS via the
// same hash inputs, so this number participates in both sides equally.
//
// 2 — chip gains its 1px accent edge (design round 1, D1) and the fingerprint
//     starts covering the resolved palette and the canonical host (review
//     round 1, minor 1).
export const CARD_TEMPLATE_VERSION = 2;
