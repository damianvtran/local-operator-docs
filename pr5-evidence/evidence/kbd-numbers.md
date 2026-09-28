# Kbd cap measurements (same probe, before/after)

Probe: `probe-boxes.mjs` against the built+served site; `kbd` boxes and computed styles.

| context | BEFORE | AFTER |
| --- | --- | --- |
| top bar Search control (flex row) | 34.4 × 23.4, display: block | 34.4 × 23.4, display: block |
| 404 page, inline in prose | 34.4 × **22.00**, display: inline | 34.4 × **23.4**, display: inline-block |

Same font-size (12px), line-height (17.4px) and padding (2px) in both contexts; the inline box took the
font content height (16px) instead of its line box (17.4px), so the cap was 1.4px short in prose.
