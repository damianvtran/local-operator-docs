---
description: TUI, desktop app, mobile relay, browser extension, exec mode, or the Python SDK — which surface to pick, and when.
section: get-started
order: 4
---

# Choose your surface

One runtime, same sessions, several ways in. You can add another surface at
any time — the terminal, the desktop app, and the mobile relay all drive the
same sessions and read the same `~/.local-operator/` configuration.

| Surface | You drive it from | Install | Choose it when |
| --- | --- | --- | --- |
| [Terminal (TUI)](/tui/quickstart) | Any terminal | `pip install local-operator` | You live in a terminal, or you want scriptable, keyboard-first control |
| Desktop app | macOS / Windows / Linux | [Downloads](https://local-operator.com/download) or `npx local-operator-ui` | You want the browser pane, file canvas, schedule pages, and a window to watch |
| Mobile relay | Your phone | `lop mobile install` | You want to check on, steer, or start sessions from the sofa |
| Browser extension | Your browser | `lop browser install` | You want the agent to drive the browser you already use, with the pages visible |
| Exec mode | Scripts, CI, cron | bundled with the runtime | You want one task, headless: `lop exec "..."`, `--json`, `--background` |
| Python SDK | Your own Python code | in development | You want to embed Local Operator in an application — watch the repo for it |

## A note on mixing

The surfaces are not separate products with separate state:

- Sessions started in the terminal register with the local daemon, so the
  phone relay can watch and steer them (see [Mobile relay](/surfaces/mobile-relay)).
- The desktop app drives the same sessions, teams, schedules and
  configuration the TUI reads.
- `lop exec` runs one task headless and exits — ideal for scripts, and the
  same runtime underneath.

{% cards %}
{% card title="Quickstart" href="/getting-started/quickstart" icon="rocket" %}
Already know what you want? Sign in and run a first task.
{% /card %}
{% card title="Install & first run" href="/getting-started/install" icon="download" %}
The full install matrix, verified.
{% /card %}
{% /cards %}
