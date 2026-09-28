---
description: Install the Local Operator runtime with pip, pipx, or uv, grab the desktop app, or run it with Docker or Nix — then verify the install.
section: get-started
order: 2
---

# Install & first run

Local Operator installs three ways that share one runtime: the terminal
runtime (a Python package), the desktop app (a bundled build of the same
runtime), and container / Nix paths for the rest. Pick the surface you want
to drive it from; you can add another later without losing sessions.

{% callout type="note" %}
The runtime needs **Python 3.12 or newer**. On systems with an
externally-managed Python (Debian/Ubuntu, Homebrew), use `pipx` or `uv`
instead of `pip`.
{% /callout %}

## Terminal runtime

{% tabs %}
{% tab label="pip" %}
```bash
pip install local-operator
```
{% /tab %}
{% tab label="pipx" %}
```bash
pipx install local-operator
```
{% /tab %}
{% tab label="uv" %}
```bash
uv tool install local-operator
```
{% /tab %}
{% /tabs %}

The install provides two equivalent entry points: `lop` (used throughout
these docs) and `local-operator`.

Optional features live behind extras. `pip install "local-operator[all]"`
brings everything below except `lsp`:

| Extra | Adds |
| --- | --- |
| `server` | The HTTP API server (`lop serve`) and the background scheduler |
| `mcp` | Model Context Protocol client support |
| `images` | HEIC/HEIF image attachment decoding |
| `tokenizer` | Exact BPE token counting (estimated otherwise) |
| `fetch` | Markdownify renderer for `web_fetch` |
| `lsp` | Jedi-backed Python navigation for the `lsp` tool |
| `all` | Everything above except `lsp` |

If a feature's extra is missing, the agent tells you which one to install
instead of failing with an import error.

## Desktop app

The desktop build for macOS, Windows and Linux ships its own backend and
uses an existing Local Operator install when it finds one — a separate `lop`
install is optional. Grab the installer from the
[downloads page](https://local-operator.com/download), or run it from a
terminal (Node.js 22.13.1 or newer):

```bash
npx local-operator-ui              # download and run in one command
npm install -g local-operator-ui   # or install it globally
```

The [desktop app guide](/surfaces/desktop) covers the app in full — what it
adds on top of the runtime, and how the two work together.

## Docker and Nix

```bash
docker compose up -d      # with the provided compose file
nix develop               # reproducible dev shell via the flake
```

## Verify the install

```bash
lop --version
lop login                 # list the providers you can sign in to
```

{% cards %}
{% card title="Quickstart" href="/getting-started/quickstart" icon="rocket" %}
Sign in to a provider and run your first task, step by step.
{% /card %}
{% card title="Choose your surface" href="/getting-started/choose-your-surface" icon="compass" %}
TUI, desktop app, phone, or headless — where each one fits.
{% /card %}
{% /cards %}
