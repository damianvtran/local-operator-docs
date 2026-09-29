---
description: Register reusable agents and teams, write their instructions and system prompts, share them through the Agent Hub, and name a team, profile or agent when you run.
section: build
order: 1
---

# Supply teams, agents & system prompts

A session can be composed from parts you write once and reuse: a **registered
agent** — a durable profile, either a *role* (a reusable way of working) or a
*specialist* (a named agent with its own instructions) — and a **team** — a
roster of those agents under one manager, plus briefs that do not belong to any
one member. Supply them here; every surface then takes them by name: `/agent`
and `/team` in the session, `--team` / `--profile` / `--agent` on `lop exec`,
and `team=` / `profile=` on the Python SDK's `SessionSpec`.

{% diagram name="SupplyFlow" caption="Declare once, share through the hub, run with a team, profile or agent" /%}

## Register an agent

```bash
lop agents create research
```

```console
╭─ Created New Agent ───────────────────────────
│ Name: research
│ ID: c1c5d72b-c3a9-49d1-a876-d06dd8b74f8e
│ Created: 2026-09-28 23:53:20.643935+00:00
│ Version: 0.64.1
╰──────────────────────────────────────────────────
```

The registry lives under your configuration root as one directory per agent —
`agents/<id>/agent.yml` for the row, with the conversation and state files
beside it, and `system_prompt.md` once the profile has instructions. The row
carries the hosted model and sampling settings (when set), description, tags
and categories. `lop agents list` reads it back:

```console
╭─ Agents ────────────────────────────────────
│ └── Agent 1
│     • Name: research
│     • ID: c1c5d72b-c3a9-49d1-a876-d06dd8b74f8e
│     • Created: 2026-09-28 23:53:20.643935+00:00
│     • Version: 0.64.1
│     • Hosting: default
│     • Model: default
│
│ Page 1 of 1 (Total agents: 1)
╰──────────────────────────────────────────────
```

**Starters.** Packaged seed profiles — `aida`, `architect`, `coder`,
`copy-reviewer`, `designer`, `manager`, `reviewer`, `scout`, `tui-designer`,
`ux-reviewer` — are **resolved by name without being installed**: launching a
role that has no row in your registry runs the packaged text directly, and the
registry stays empty. *Installing* is the separate, deliberate act — the
`agent` tool's `install` op copies the seed into your registry as a row you own
and edit (`reset` restores the packaged text over an edited install).
`lop agents sync` then keeps installed starters and hub-pulled agents up to
their latest text:

```bash
lop agents sync                  # every installed seed and hub pull
lop agents sync --name reviewer  # one profile
lop agents sync --force          # also replace copies edited after install
```

With nothing installed yet, `sync` says so — `nothing to sync: no installed
seed or hub-pulled profiles.` — rather than inventing work.

## Write the instructions — the system-prompt path

An agent's instructions are its **base**: the reusable half that is true
wherever it works; a team's briefs layer on top of it. Three layers, read
outermost last:

- **Base — `agents/<id>/system_prompt.md`.** The role itself: how this kind of
  work is done well. Reusable across every team. The `agent` tool's `create` /
  `update` write it, and `/agent <name>` adopts it for the current session.
- **Collaboration — `teams/<id>/instructions.md`.** How this group works
  together: review order, sign-offs, who blocks a release.
- **Project — `teams/<id>/project.md`.** The product or domain this instance
  of the team owns. Swap it to reuse the same roster elsewhere.

{% callout type="note" %}
Older agent rows also carry a `security_prompt` field — the legacy per-agent
security context for the runtime's code-security checks. It is not the profile
instructions: new profiles are described by `system_prompt.md`, and
`security_prompt` stays a free-text row field for installs that want to state
their security context explicitly.
{% /callout %}

## Declare a team

```bash
lop teams create feature-release --manager manager --member coder --member reviewer:2
```

```console
╭─ Created New Team ───────────────────────────
│ Name: feature-release
│ Manager: manager
│ Members: 3
╰──────────────────────────────────────────────────
```

`--member` is repeatable and takes `role` or `role:count`. A team is stored as
`teams/<id>/team.yml` beside its two briefs — `instructions.md` and
`project.md`, empty until you write them. `lop teams show <name>` prints the
roster:

```console
╭─ Team feature-release ───────────────────────────
│ Manager: manager
│ Roster:
│   - manager: manager (you, when this team is invoked)
│   - coder
│   - reviewer x2
╰──────────────────────────────────────────────────
```

A member slot can also be another team — prefix it with `team:` — which turns a
roster into an org: `--member team:pod` nests the team `pod`, `--member
team:pod:2` adds two more copies, and `lop teams show` badges nested slots
`(team)`:

```bash
lop teams create pod --member coder
lop teams create eng-org --manager manager --member team:pod --member team:pod:2
```

In a session, `/team` lists teams, `/team <name> <request>` attaches one — the
current agent becomes its manager — and sends the request as a real turn, and
`/team chart [name]` draws the org chart.

## Run with a specific team, profile or agent

| Command | Attaches |
| --- | --- |
| `lop exec "…" --team <name>` | a saved team — manager, roster and briefs |
| `lop exec "…" --profile <name>` | a reusable role or specialist (the `/agent` counterpart) |
| `lop exec "…" --agent <name>` | a legacy named agent; creates it if missing |
| `lop exec "…" --agent-id <id>` | one exact registered agent, by id |
| `SessionSpec(team=…, profile=…, agent_name=…, agent_id=…)` | the same four, from Python |

```bash
lop exec 'Review the change' --team release --background
printf 'Inspect this report' | lop exec --profile reviewer
```

```python
spec = SessionSpec(
    hosting="openrouter",
    model="…",
    team="release",          # or profile="reviewer"
    name="episode task_001",
)
```

The SDK resolves `team` and `profile` against the session's declared roots —
through the same helper `lop exec` uses — and attaches them to the session
post-open, so a script composes exactly what the CLI names. On `spawn_session`,
attachments belong to the owner's side: open in-process, attach what you need,
dispose, then spawn the same id — resume restores them. The [Python
SDK](/build/python-sdk) page has the full entry-point table.

## Typed contracts

For embedders, the supply objects are typed — all under the `local_operator`
package:

| Object | Carries |
| --- | --- |
| `AgentData` — `agents.py`, a pydantic model | `id`, `name`, `version`, `security_prompt`, `hosting`, `model`, `description`, `tags`, `categories`, sampling settings |
| `AgentProfile` — `agent_profiles.py`, a frozen dataclass | `name`, `description`, `when_to_use`, `instructions`, `tools`, `effort`, `may_delegate` |
| `SessionSpec` / `SessionRoots` / `ApprovalPolicy` — `sdk` | the run's composition — model pair, `team`, `profile`, `agent_name`, `agent_id`, `tools`, approvals — over explicit roots |
| `TeamRegistry` — `teams.py` | create, read and update of team rows and their briefs |

The SDK's full surface — entry points, approval presets, isolation rules — is
documented in the repository:
[`docs/SDK.md`](https://github.com/damianvtran/local-operator/blob/main/docs/SDK.md).

{% cards %}
{% card title="Exec mode" href="/build/exec-mode" icon="terminal" %}
Run a supplied team or profile headless — flags, JSON streams and background jobs.
{% /card %}
{% card title="Python SDK" href="/build/python-sdk" icon="code" %}
The same composition, typed: SessionSpec, explicit roots, approval policies.
{% /card %}
{% card title="Agent Hub" href="/capabilities/agent-hub" icon="globe" %}
Share agents and teams publicly, or with your organization.
{% /card %}
{% /cards %}
