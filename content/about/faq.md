---
description: Short answers to the questions people ask first — privacy, accounts, models, cost, offline use, platforms and updates.
section: about
order: 2
---

# FAQ

Short answers to the questions that come up first. Each one links into the
guide that goes deeper.

### Does my data leave my machine?

Most of it never does. Sessions, files, credentials and configuration stay
in `~/.local-operator/` on your computer, and commands run locally. Two
things can go out, both by design: model requests (to the provider you chose)
and web search / `web_fetch`, which are on by default and can be switched off
(`lop search off`, `lop fetch set enabled off`). With a local model and
search off, no prompt leaves the machine.

### Do I need a cloud account to use it?

No. The runtime never asks you to create an account. You *do* sign in to a
model provider — a subscription login or an API key — or point it at a local
model. A Radient account only comes in if you want to publish to the
[Agent Hub](/capabilities/agent-hub) or share within a team.

### Which models can I use?

- **Subscriptions you may already pay for** — Claude, ChatGPT, Kimi, Grok,
  Z.AI, Qwen — signed in through the browser; multiple accounts per provider
  can pool and rotate.
- **API keys** — Gemini, DeepSeek, Mistral, OpenRouter, Radient, plus
  standard environment variables.
- **Local servers** — LM Studio, Ollama, vLLM, llama.cpp, and any
  OpenAI-compatible URL.

Switch provider or model mid-conversation from the model picker.

### What does it cost?

Local Operator itself is free and open source (MIT). Model use is billed by
whichever provider you signed in to — your existing subscription, or your
API usage — and local models cost nothing beyond your hardware.

### Does it work offline?

With a local model, yes: sessions, files, commands and the interface all
work without a network. Cloud models, web search and `web_fetch` need
connectivity.

### Is my code sent anywhere?

Only when a cloud model needs to see it. The agent reads and edits files on
your machine, and when a piece of content is part of the conversation it
travels to your provider the way any prompt would. Approvals gate the
actions, and every tool call leaves a receipt — so it is visible what was
read and when. With a local model, nothing is sent anywhere.

### Which platforms does it run on?

The terminal runtime runs anywhere Python 3.12 or newer runs — macOS, Linux
and Windows. The desktop app ships for macOS, Windows and Linux. Scheduled
wakes are supervised by launchd on macOS, a systemd user service on Linux,
or a Task Scheduler task on Windows.

### How do updates work?

`lop update` — or `/update` inside the TUI — upgrades from PyPI. The desktop
app updates itself from GitHub Releases. Running work is not disturbed: new
code is adopted only once everything is idle. The full matrix is in
[Updating Local Operator](/getting-started/updating).

### Do sessions survive closing the terminal?

Yes. Transcripts persist on disk, and `/resume` brings any conversation back
with its history. Work that has been scheduled keeps going too — wakes fire
with every interface closed, handled by the wake supervisor.

### Can I use it on more than one computer?

Yes. Install on each machine and pair them with the
[Agent Mesh](/capabilities/agent-mesh): sessions on one become reachable
from the other, and a conversation can be handed over — or brought home —
with its transcript.

### Is this only for software work?

No. Code is one use, and a good one — but the same agent does research, file
organization, data cleanup, spreadsheet work and scheduled checks. If you can
describe it to a capable assistant at your computer, it is fair game.

### Can it run things on a schedule while I'm away?

Yes. A session can schedule its own future turns (wakes), and the wake
supervisor starts a runtime when one comes due — even with the terminal
long closed. Missed occurrences are skipped, not replayed, and approvals
still apply unless you opt into unattended execution. Aida, the built-in
chief of staff, is a daily check-in built on the same mechanism — see
[Always-on & proactive agents](/capabilities/always-on).

### How do I stop something it is doing?

In the TUI, `esc` stops the agent without ending the session. At an
approval, **Deny** refuses that action and the turn continues. For proactive
output, `/aida pause` holds her check-ins; `aida.enabled=false` (or
`LOCAL_OPERATOR_NO_AIDA=1`) switches her off entirely.

{% cards %}
{% card title="Why Local Operator" href="/about/why" icon="sparkles" %}
The longer argument — and when a different tool is the better fit.
{% /card %}
{% card title="What is Local Operator?" href="/getting-started/what-is-local-operator" icon="home" %}
The overview, the surfaces, and what it is not.
{% /card %}
{% /cards %}
