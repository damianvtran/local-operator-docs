---
description: Sign in to a provider, launch the terminal UI, run your first task, and approve a tool call — the five-minute first-run path.
section: get-started
order: 3
---

# Quickstart

{% steps %}
{% step title="Sign in to a provider" %}
Every provider runs on the same harness and the same model picker. OAuth
providers sign in through the browser and use your existing subscription;
API-key providers prompt once and store the key locally.

```bash
lop login              # list every login-capable provider
lop login anthropic    # or openai, kimi, xai-oauth, zai-oauth, ...
```

`lop login <provider>` also sets that provider as your default hosting and
picks a default model, so the very next `lop` just works. Skip this step and
an interactive `lop` opens in a setup state that walks you through `/login`
instead.
{% /step %}

{% step title="Launch the terminal UI" %}
```bash
lop
```

The welcome screen is ready for a first prompt. Give it something real:
*sort this folder by project and tell me what's misnamed* or *summarize
this repo and list what's untested*.
{% /step %}

{% step title="Let it work — and steer it" %}
Tool calls stream in as one-line receipts; expand a card with
{% kbd %}enter{% /kbd %} or {% kbd %}space{% /kbd %} to see the full command
and output. Type while the agent works and your message is delivered at the
next step as steering — no need to wait. {% kbd %}esc{% /kbd %} stops the
agent without ending the session.
{% /step %}

{% step title="Approve a tool call" %}
Read-only tools run automatically; anything that writes files or executes
commands prompts first, showing the exact command before it runs. Approve
once, or set a mode with `/approvals` when you trust the task.
{% /step %}

{% step title="Come back later" %}
Sessions persist. `/resume` opens a picker over your recent conversations,
each with its title and age, and continues the one you pick. Configuration
and credentials live under `~/.local-operator/` (`config.yml`, `auth.db`).
{% /step %}
{% /steps %}

## Prefer a local model?

A 7–14B model needs roughly 10–16 GB of RAM or VRAM. Start
[LM Studio](https://lmstudio.ai), load a chat model, enable its server, then
`/login lmstudio` inside Local Operator — `/login` also offers Ollama, vLLM,
llama.cpp and a generic OpenAI-compatible server. The CLI form works too,
for a model already installed in [Ollama](https://ollama.com/download):

{% command %}lop --hosting ollama --model qwen2.5:14b{% /command %}

## Where to go next

{% cards %}
{% card title="The terminal UI" href="/tui/quickstart" icon="terminal" %}
Launch, layout, keys worth knowing, and the slash commands that matter.
{% /card %}
{% card title="Choose your surface" href="/getting-started/choose-your-surface" icon="compass" %}
The same sessions from the desktop app, your phone, or headless scripts.
{% /card %}
{% card title="Connect your phone" href="/surfaces/mobile-relay" icon="smartphone" %}
Watch and steer sessions from your phone with the mobile relay.
{% /card %}
{% /cards %}
