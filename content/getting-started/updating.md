---
description: Update the runtime with lop update or /update, upgrade an install by hand, and find release notes.
section: get-started
order: 5
---

# Updating Local Operator

## The built-in updater

`lop update` upgrades the install from PyPI and restarts the mobile daemon
when its LaunchAgent is installed. Inside the TUI, `/update` installs the
latest version and relaunches the terminal.

Running work is not at risk: the runtime adopts newly installed code only
when all work is safely idle (active turns, tools, compaction, loops, child
agents and background jobs defer the refresh), and a failed update leaves
the current terminal and runtime running. The new terminal reattaches to the
same conversation — streamed output and unanswered prompts included.

## Upgrading by hand

| Install method | Upgrade with |
| --- | --- |
| pip | `pip install --upgrade local-operator` |
| pipx | `pipx upgrade local-operator` |
| uv | `uv tool upgrade local-operator` |
| Desktop app | Updates itself from GitHub Releases; reinstall from the [downloads page](https://local-operator.com/download) if needed |

## Checking your version

```bash
lop --version          # what's installed
lop login-status       # what's currently signed in
```

Release notes and installers live on
[GitHub Releases](https://github.com/damianvtran/local-operator/releases).

{% cards %}
{% card title="Install & first run" href="/getting-started/install" icon="download" %}
The full install matrix, extras, Docker and Nix.
{% /card %}
{% card title="Quickstart" href="/getting-started/quickstart" icon="rocket" %}
First run, first task, first approval.
{% /card %}
{% /cards %}
