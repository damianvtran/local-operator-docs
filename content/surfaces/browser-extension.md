---
description: Give the agent the browser you are already signed into — install from the Chrome Web Store, pair the bridge, and know exactly what it can and cannot do.
section: surfaces
order: 5
---

# Browser extension

The browser extension hands the agent the browser you already use — with
your real logins. It can open pages, read them, click, type and take
screenshots, and you decide which sites it may visit. Sign in to a site by
hand and the agent carries on from there.

## Install

{% steps %}
{% step title="Add the extension" %}
Install **Local Operator** from the
[Chrome Web Store](https://chromewebstore.google.com/detail/local-operator/omibaecbjdhgbbcedbnnnmjpmopfheof).
It works in Chrome and other Chromium-based browsers (Edge, Arc, Brave).
{% /step %}
{% step title="Install the bridge" %}
The bridge is the piece that lets your local runtime reach the extension —
it runs on your machine:

```bash
lop browser install   # install the bridge daemon
lop browser status    # check that it is running
```
{% /step %}
{% step title="Pair" %}
```bash
lop browser pair
```

That prints a 6-digit code. Type it into the extension's popup — no account,
no sign-up. To revoke the pairing, reset it from the extension or run
`lop browser pair --reset`.
{% /step %}
{% /steps %}

## What it does

- **Drives the browser you are signed into.** The agent can open pages, read
  them, click, type and take screenshots, so sites that need your login work
  without passing credentials around.
- **Works in its own tab.** It opens a tab for the task and leaves yours
  alone.
- **Asks before new sites.** The first time the agent wants a site, you get
  a prompt: allow once, always allow, or deny.
- **Shows its work.** While the agent is attached, Chrome displays its
  debugger banner — that banner is the visible tell that the session is
  driving the browser.

## What stays on your machine

The bridge is **loopback-only**: the connection between your runtime and the
extension never leaves your computer, and there is no analytics reporting
and no cloud browser involved. The permissions the extension asks for are:

`debugger · tabs · tabGroups · scripting · storage · alarms · webNavigation · notifications`

The debugger permission is what lets the agent click and type in a page —
Chrome reflects that with the banner above, so an active session is always
visible.

## Building from source

The extension lives in `extension/` in the
[local-operator repo](https://github.com/damianvtran/local-operator). To run
your own build:

```bash
pnpm -C extension build
```

Then load `extension/dist` as an unpacked extension in your browser's
developer mode.

{% cards %}
{% card title="Desktop app" href="/surfaces/desktop" icon="monitor" %}
A browser the agent can share lives inside the desktop app too.
{% /card %}
{% card title="Agent Hub" href="/capabilities/agent-hub" icon="store" %}
Pull community agents that use the browser, teams, and MCP servers.
{% /card %}
{% /cards %}
