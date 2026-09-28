---
description: The pieces around the runtime — model providers, Radient, MCP servers, skills, teams, the Agent Hub, and the browser extension.
section: ecosystem
order: 1
---

# What's in the ecosystem

Local Operator is one program on your machine. What surrounds it is a small
ecosystem you can plug into — providers to run the models, tools and knowledge
to give the agent, a place to publish what it learns, and surfaces to reach it
from. This page is the map.

{% diagram name="EcosystemMap" caption="Providers, tools, sharing, and the surfaces that reach it" /%}

## Model providers

Local Operator talks to whichever provider you point it at, and keeps the
differences out of your way:

- **Subscriptions you already pay for** — sign in once and the agent uses the
  plan's quota: ChatGPT, Claude, Kimi, Grok, Z.AI and Qwen all have login flows
  (`lop login`, or `/login` in the TUI). Multiple accounts on one provider pool
  and rotate; failover follows a chain you can edit in `config.yml`.
- **API keys** — Gemini, DeepSeek, Mistral, OpenRouter and Radient are set with
  a masked prompt and stay on your machine (`~/.local-operator/auth.db`).
- **Local servers** — LM Studio, Ollama, vLLM and llama.cpp run models on your
  own hardware; anything speaking the OpenAI API can be added by URL, so a
  proxy or a homegrown gateway fits too.

{% figure src="/shots/tui/login-prompt.png" alt="A provider login in progress in the TUI — the browser opens for OAuth, or a key is pasted into a masked prompt" caption="A provider login: OAuth through the browser, or a key into the masked prompt." /%}

## Radient

Radient is the hosted service the agent can run on, and where its community
work lives.

**Radient Pass** is a prepaid balance on one key. One credit is one dollar at
provider cost — no subscription and no per-request markup — you top up in the
console (a small top-up fee applies, minimum $5), and credits do not expire.
The key is a standard bearer token, so anything that speaks the OpenAI API can
use it.

**Radient Automatic** is the routing mode: instead of naming a model, ask for
`model: auto` and each step goes to a model picked for cost and quality. In
the terminal it is `lop --hosting radient` with no `--model`; in the desktop
app, signing in with Google or Microsoft creates a Pass for you and turns
Automatic on.

Sign up at [console.radienthq.com](https://console.radienthq.com); the
documentation lives at [docs.radienthq.com](https://docs.radienthq.com).

## The Agent Hub

The Agent Hub is the community registry of agents — browse it in the desktop
app's Agent hub page, or pull straight from the CLI:

```bash
lop agents pull --id "agent_id"          # reading is public; no key needed
lop credential update [redacted]
lop agents push --name "My Agent"        # publishing needs an account
```

Pulled agents join your local registry. The
registry's API is public too:
[api.radienthq.com/v1](https://api.radienthq.com/v1).

## MCP servers

Local Operator speaks the [Model Context Protocol](https://modelcontextprotocol.io)
over the official SDK, with lazy tool loading: a server advertises a summary,
and individual tool schemas enter the context only when the agent enables
them.

```bash
lop mcp add linear --url https://mcp.linear.app/mcp --oauth
lop mcp login linear
lop mcp list
```

Servers configured for Claude Code, Cursor, VS Code or Codex CLI are imported
where possible, and project-level configs are discovered too.

## Skills

A skill is a folder with a `SKILL.md`. Drop it in
`~/.local-operator/skills/<name>/` and the agent indexes it — only skills
relevant to the current turn surface, and their bodies load on demand, so
unused knowledge does not tax the context. `/skills` lists what is loaded, and
`$` in the composer picks one by name (`$research compare these two API
designs`). A skill marked `hide: true` is reachable only that way.

## Teams

A saved team is a roster — a manager plus members with counts — layered with
two briefs the individual agents never hard-code: how the group works
together, and what product this instance owns. A slot can name another team,
so a team nests into an org of teams. `/team <name> <request>` puts the roster
on the work; `/team chart <name>` draws it. Reviewer, coder, architect,
manager, designer and scout ship as starter roles; `agent install` copies one
into your registry to edit. From the CLI: `lop teams list`, `lop teams show`.

{% figure src="/shots/tui/org-chart.png" alt="A team drawn as an org chart, with a director role and two nested pods" caption="A team as an org chart — `/team chart` shows the roster and any nested teams." /%}

## The browser extension

The extension gives the agent the browser you already use, with your logins
intact, working in its own tab: it can open pages, read, click, type and take
screenshots, and it asks before visiting a new site. The bridge stays on your
machine — loopback only, no cloud browser. Install it from the
[Chrome Web Store](https://chromewebstore.google.com/detail/local-operator/omibaecbjdhgbbcedbnnnmjpmopfheof),
then pair: `lop browser install`, `lop browser status`, `lop browser pair`. See
[the extension guide](/surfaces/browser-extension) for the flow in full.

## Where things live

| What | Where |
| --- | --- |
| Product site, downloads | [local-operator.com](https://local-operator.com) |
| Runtime source, releases | [github.com/damianvtran/local-operator](https://github.com/damianvtran/local-operator) |
| Desktop app source | [github.com/damianvtran/local-operator-ui](https://github.com/damianvtran/local-operator-ui) |
| Python package | [pypi.org/project/local-operator](https://pypi.org/project/local-operator/) |
| Radient console | [console.radienthq.com](https://console.radienthq.com) |
| Radient docs | [docs.radienthq.com](https://docs.radienthq.com) |

{% cards %}
{% card title="Agent Hub" href="/capabilities/agent-hub" icon="store" %}
Browsing, pulling and publishing agents — the guide.
{% /card %}
{% card title="Python SDK" href="/build/python-sdk" icon="code" %}
Drive any of this from your own code.
{% /card %}
{% /cards %}
