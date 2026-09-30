---
description: What Local Operator does differently — everything on your machine, one runtime for every surface, a mesh across your computers, and when a different tool fits better.
section: about
order: 1
---

# Why Local Operator

Plenty of tools can put a model in a chat box. Local Operator is built
around a different bet: the agent should work **where your work actually
lives** — your machine, your files, your accounts — and you should be able
to reach it from anywhere, or leave it working while you walk away.

## It runs on your machine

Sessions, files, credentials and configuration live on your computer, under
`~/.local-operator/`. When the agent runs a command, it runs here. When it
edits a file, the edit lands in your working copy. You can unplug it and
nothing about your setup stops working.

So what leaves the box? Only what you would expect:

- **Model requests** go to the provider you signed in to — your existing
  subscription, an API key, or a local model, in which case the prompts do
  not leave your machine at all.
- **Web search** is on by default (that is where search results come from),
  and both search and `web_fetch` can be switched off (`lop search off`,
  `lop fetch set enabled off`) for a setup where no prompt leaves the
  machine.
- **Nothing goes to us.** There is no Local Operator cloud holding your
  sessions, and no account to create before your first prompt.

The same principle shapes the safety model: read-only tools run
automatically, writes and commands ask first with the exact command shown,
and every action leaves a receipt in the transcript.

## One runtime, every surface

The terminal, the desktop app, the phone relay, the browser extension and
headless `exec` are not separate products with separate state. They are
front ends onto one local runtime:

- Start a session in the terminal, watch and steer it from the desktop app,
  see it in the phone's session list.
- Hand one task to `lop exec` from a script, then open the same session and
  read the full transcript.
- Inside a session, an agent manages other sessions with the `sessions` tool:
  list what is running, spawn a listed workstream, or peek at a transcript —
  the CLI (`lop sessions`, `lop exec`) stays the human path.
- Move between machines later without moving your configuration — it is all
  the same `~/.local-operator/` layout wherever it runs.

## Teams and projects, not just prompts

- **Teams** make delegation concrete: a manager agent plus members with a
  written brief, a shared project context, and a report at the end. You can
  ask for a review team, a research team, or one you designed yourself.
- **Projects** keep work that spans days or several conversations from
  scattering: related sessions, a progress line, milestones and dates in one
  record.

## A mesh for your own computers

Your laptop cannot always do the work — it sleeps, it travels, it runs out
of battery. The Agent Mesh pairs your machines so a session on one can
reach another: see what the always-on box at home is running, start a
session *there*, or move a conversation onto it.

Moving is lossless and deliberate: a session can be **handed over** to
another device with its transcript, tools and todos intact, and it can come
home again — or be recovered from the last synced copy if the machine
holding it is gone.

{% diagram name="SessionHandoff" caption="Handing a session to another device, and bringing it home again" /%}

Pairing is human on both ends: one device mints a single-use invite, the
joining side shows a code and a fingerprint, and a person compares them
before anything is admitted. Agents can drive the ceremony to the point of
confirmation — never through it.

## Work that continues when you don't

Schedules (wakes) let a session start its own future turns, and a small
supervisor wakes sessions even when every terminal is closed. That is the
same raw material Aida, the built-in chief of staff, is built on: a daily
check-in that reports only what needs your attention, and can be paused or
switched off entirely.

## Open and extensible

- **MIT and readable.** The runtime is open source; you can read exactly
  what it does.
- **Your models.** Subscriptions via login (Claude, ChatGPT, Kimi, Grok,
  Z.AI, Qwen), API keys, or local servers (LM Studio, Ollama, vLLM,
  llama.cpp) — and an OpenAI-compatible escape hatch for anything else.
- **Skills.** Drop a `SKILL.md` folder into `~/.local-operator/skills/` and
  the agent loads it when a task matches; you can also invoke one by name
  from the composer.
- **MCP.** Connect Model Context Protocol servers (`lop mcp add ...`), with
  tool loading kept lazy so a large server does not flood the context.
- **Community.** Agents and skills can be packaged and shared — the
  public shelf is the [Agent Hub](/capabilities/agent-hub) — and teams can
  be shared privately within an organization.

## When to use something else

Honest boundaries, so you can pick well:

- **You want zero setup and no machine of your own.** A hosted assistant
  that runs entirely in someone else's cloud will ask less of you. Local
  Operator's answer to "where does it run" is your hardware, on purpose.
- **You need work to continue while every one of your machines is off.**
  Nothing local can run then — wake scheduling needs a computer that is on
  (or one that comes back soon; missed occurrences are skipped, not
  replayed).
- **You only ever want a single quick question.** Any chat window is faster
  than installing a runtime.
- **Your environment forbids local agents.** The extension, the mesh and the
  wake supervisor are all local services; managed corporate machines
  sometimes disallow that class of software.

If none of those apply, start with [Install & first run](/getting-started/install)
— the rest of these docs assume you did.

{% cards %}
{% card title="What is Local Operator?" href="/getting-started/what-is-local-operator" icon="home" %}
The overview, the surfaces, and what it is not.
{% /card %}
{% card title="FAQ" href="/about/faq" icon="help-circle" %}
Privacy, accounts, models, cost, platforms — short answers.
{% /card %}
{% /cards %}
