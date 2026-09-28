---
description: Local Operator is an agent runtime that runs on your machine — one runtime every surface, from the terminal to your phone.
section: get-started
order: 1
---

# What is Local Operator?

Local Operator is an agent runtime that runs on **your machine**. You hand it
a task the way you would to someone sitting at your desk — *sort this folder*,
*find what broke in last night's build*, *pull the numbers out of these
invoices* — and it works: running commands, editing files, reading the web,
asking for approval before anything risky.

It is open source (MIT), and it does not need a cloud account. Your sessions,
credentials and configuration live in `~/.local-operator/` on your computer,
and model calls go to whichever provider you signed in to.

## One runtime, every surface

One install is one pool of sessions, and several front ends drive it:

- **Terminal.** `lop` opens a full-screen TUI: streaming transcripts,
  expandable tool cards, an approval prompt before anything writes.
- **Desktop app.** A window for the same work — chat with run details,
  projects, schedules, a browser, and the Agent hub.
- **Phone.** The mobile relay lets you watch, steer, or start sessions from
  your phone, against the machine doing the work.
- **Browser extension.** The agent gets the browser you are already signed
  into — its own tab, your logins, your permission per site.
- **Headless.** `lop exec "..."` runs one task with no interface at all,
  ready for scripts, cron, and CI.
- **Python SDK.** `local_operator.sdk` embeds the runtime in your own
  Python code.

{% diagram name="SurfaceMap" caption="One runtime, every surface" /%}

Sessions are shared, not siloed: a conversation started in the terminal shows
up in the desktop app's list, the sidebar, and the phone relay — because all
of them read the same local session store.

## What makes it different

- **It runs on your machine.** Commands execute on your computer, edits land
  in your files, and nothing runs on servers we control — because there are
  none. Your provider credentials stay local.
- **Teams, not one-off prompts.** A team is a manager plus members
  (reviewer, coder, architect, designer, and more) with a written brief. You
  hand over a goal; the manager splits it, delegates, and reports back.
- **Projects.** Durable workstreams gather related sessions, milestones and
  progress in one place, so work that spans days or several conversations
  keeps its shape.
- **The mesh.** Pair your computers and they can see each other's sessions:
  start one on the always-on box, prompt it from the laptop, and move a
  conversation between machines — transcript and all — when you move.

{% diagram name="SessionHandoff" caption="A conversation moving between machines — transcript and all" /%}

- **Work continues when you walk away.** Sessions schedule their own future
  turns, and a small supervisor wakes them even if the terminal that
  scheduled the work is long closed. Aida, the built-in chief of staff,
  checks in once a day with what needs your attention.
- **Bring your own models.** Sign in to the subscription you already pay for
  (Claude, ChatGPT, Kimi, Grok, Z.AI, Qwen), use an API key, or point it at
  a local model with LM Studio, Ollama, vLLM or llama.cpp.

## What it isn't

- **Not a cloud service.** There is no Local Operator cloud, and no remote
  account holding your sessions. When all your machines are off, nothing
  runs.
- **Not a model.** It does not ship weights and does not charge for model
  use — you bring a provider or a local model, and you pay that provider
  directly.
- **Not autopilot.** Read-only tools run on their own, but anything that
  writes files or runs commands asks first until you decide otherwise.
- **Not only for code.** The same agent does research, file work, data
  cleanup and scheduled jobs — coding is just where it starts.

## Where to go next

{% cards %}
{% card title="Install & first run" href="/getting-started/install" icon="download" %}
Get the runtime, sign in to a provider, verify the install.
{% /card %}
{% card title="Quickstart" href="/getting-started/quickstart" icon="rocket" %}
Your first task, end to end, in five minutes.
{% /card %}
{% card title="Choose your surface" href="/getting-started/choose-your-surface" icon="compass" %}
Terminal, desktop, phone, browser, or headless — where each one fits.
{% /card %}
{% card title="Why Local Operator" href="/about/why" icon="sparkles" %}
The longer argument, and when something else is the better tool.
{% /card %}
{% /cards %}
