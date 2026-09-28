---
description: Drive sessions from Python — open or spawn one, deliver prompts, stream typed events, and collect results, with explicit roots and an approval policy.
section: build
order: 2
---

# Python SDK

`local_operator.sdk` is the programmatic way to run sessions. It is not a
wrapper around the CLI: your script calls the same objects every front end
calls — the same construction path `lop exec` uses, the same engagement router
the phone and mesh use, the same session object the TUI drives. Caching,
compaction, failover, delegation, skills, guides and MCP arrive exactly as they
do for any other surface.

There is nothing extra to install: the SDK ships inside the `local-operator`
package you already have.

```bash
pip install local-operator   # or pipx / uv tool, as in the install guide
```

```python
from local_operator.sdk import (
    ApprovalPolicy, SessionRoots, SessionSpec, events, open_session,
)
```

{% diagram name="SdkLifecycle" caption="Spec, roots and approvals; open, subscribe, prompt, close" /%}

## Quickstart: a session in your own process

`open_session` builds the session inside your process — the same shape as a
foreground `lop exec` run: if your program dies, the turn dies with it.

```python
import asyncio
from local_operator.sdk import ApprovalPolicy, SessionRoots, SessionSpec, events, open_session


async def main() -> None:
    roots = SessionRoots(  # REQUIRED: explicit roots, no ambient default
        config_dir="/srv/audit/config",   # the private store: transcripts, credentials, secrets
        agent_home="/srv/audit/home",     # the workspace home the agent reads and writes
        cwd="/srv/audit/checkout",        # where the session runs
    )
    spec = SessionSpec(
        hosting="deepseek",
        model="deepseek-flash",
        approvals=ApprovalPolicy.declared(["read", "grep", "glob"]),
        name="nightly audit",
    )
    async with open_session(spec, roots=roots) as session:
        stream = events(session)  # subscribe FIRST — events are not replayed
        await session.prompt("Summarize the repository")
        async for event in stream:
            print(event.type)
            if event.type == "agent_end":  # this prompt's terminal event
                break  # the stream itself never ends — end it explicitly
        await stream.aclose()


asyncio.run(main())
```

Exiting the `async with` disposes the session. Subscribe before prompting:
like every runtime stream here, the event feed is live, not a replay log — the
transcript is the replay log.

## Entry points

| Entry point | What it does |
| --- | --- |
| `open_session(spec, roots=…, mode="own"\|"attach")` | `own`: builds and runs the session in this process. `attach`: opens a viewer for an id whose runtime is **already live**; a cold id is refused with a remedy. |
| `spawn_session(spec, roots=…, errand=…)` | Starts a runtime that survives your process, then delivers the errand. Mints the new session id; a resumed id skips the warm step. |
| `deliver(session_id, roots=…, errand=…)` | One engagement for an existing session — live or cold — without a spec. Accepts a concrete id or `@latest`. |
| `events(session)` | Subscribe and get a `SessionEventStream` — an async iterator over the session's events; `aclose()` (or `async with`) unsubscribes. |

Errands are the runtime's typed vocabulary: `PromptErrand` (a user turn),
`SteerErrand`, `PeerMessageErrand`, `WakeErrand`, `WarmErrand`.
`spawn_session` and `deliver` return an `EngageOutcome` — `session_id`,
`detail`, `spawned`, `duplicate`.

## Worked example: spawn, deliver, stream, collect

A long-lived runtime fed by several engagements, watched by a viewer, with the
final message collected from the event stream.

```python
import asyncio
from local_operator.sdk import (
    PromptErrand, SessionRoots, SessionSpec, deliver, events, open_session, spawn_session,
)

async def main() -> None:
    roots = SessionRoots(
        config_dir="/srv/audit/config",
        agent_home="/srv/audit/home",
        cwd="/srv/audit/checkout",
    )

    # 1. Spawn: a runtime that outlives this process, with the first prompt.
    #    A spawned child is composed from its environment, so the spec carries
    #    its model pair and nothing else — see "What the surface does not carry".
    outcome = await spawn_session(
        SessionSpec(hosting="deepseek", model="deepseek-flash"),
        roots=roots,
        errand=PromptErrand(text="Summarize the repository"),
    )
    print(f"session {outcome.session_id}: {outcome.detail}")

    # 2. Deliver: further work to the same conversation, from anywhere.
    await deliver(
        outcome.session_id,
        roots=roots,
        errand=PromptErrand(text="Now list what is untested"),
    )

    # 3. Attach as a viewer and follow the next turn live.
    #    An attach spec carries resume only — everything else is the owner's side.
    async with open_session(
        SessionSpec(resume=outcome.session_id), roots=roots, mode="attach"
    ) as viewer:
        stream = events(viewer)
        await viewer.prompt_and_wait("Draft a short summary for the team")
        final = None
        async for event in stream:
            if event.type == "agent_end":  # this turn's terminal event
                final = event.messages[-1] if event.messages else None
                break
        await stream.aclose()
        if final is not None:
            print(final.content[0].text)


asyncio.run(main())
```

Points that matter in that script:

- `spawn_session` hosts the runtime in a detached child process, so the work
  survives the script; long-lived work belongs under a supervisor (launchd).
  A person ends it with `lop stop <session-id>` — not by killing a pid.
- `prompt_and_wait` submits a turn and waits for its terminal outcome. On a
  viewer, plain `prompt` returns as soon as the runtime admits the turn, so a
  scripted turn uses this verb.
- `agent_end` carries the turn's messages; the last one is the assistant's
  reply. Events are typed objects — `event.type` is the discriminator — so
  your loop matches cases rather than parsing text.

## What the surface does not carry

Stated plainly, and refused loudly rather than ignored when a call asks for it:

- **Loops.** `--loop` and `--loop-goal` are exec's continuation mechanism; an
  SDK caller drives turns itself.
- **`--effort` as a runner knob.** Use `birth_effort` for the construction-time
  reasoning level.
- **Attach auto-spawn.** A cold id gets a remedy, not a spawn — use
  `spawn_session` or `deliver` first, then attach.
- **Post-open attachments on a spawn.** `team`, `profile`, `tools`, `name`,
  `goal`, non-default `approvals` and `yolo` have no channel to a new runtime
  child. The composition that works: `open_session` in-process, attach what you
  need, dispose, then `spawn_session` the same id — resume restores the
  attachments.

## Approval policies

| Preset | Behaviour |
| --- | --- |
| `ApprovalPolicy.refuse()` | The default. Every gated call gets a typed refusal — never a silent "user denied". |
| `ApprovalPolicy.auto()` | Every gated call approved. The same posture as `--yolo`. |
| `ApprovalPolicy.declared([...])` | The named tools stand as their own approval, inside a reach bound to exactly them. Excluded tools are unreachable, and delegated children inherit the bound. |
| `ApprovalPolicy.callback(fn)` | `fn` decides, exactly as a full front end's approval handler does. |

The SDK is stricter than a piped `lop exec` on purpose: exec infers the
declared-tools posture from a terminal, and an SDK process has no terminal to
consult. So the stand is opt-in — you say `declared([...])` — and under
`refuse()` a declared inventory's write/exec calls are still gated.

`ask` questions are not installed by any preset; the `ask` tool is simply
absent until a host supplies a surface on the session object.

## The spec

`SessionSpec` mirrors `lop exec`'s options; the first eight fields are pinned
field-for-field to exec's session namespace.

| Field | Meaning |
| --- | --- |
| `hosting`, `model` | Provider and model for the session. |
| `agent_name`, `agent_id` | Legacy named-agent selection (the exec flags of the same names). |
| `yolo`, `train` | Exec's approval override and legacy history mode. |
| `resume` | Session id to resume, or `@latest`. There is a helper: `spec.with_resume(id)`. |
| `workstream` | Ask for the run to be listed as a long-lived workstream (meaningful under an agent's shell). |
| `birth_effort` | Construction-time reasoning level. |
| `team`, `profile` | Attach a saved team or a reusable role after construction. |
| `tools` | The run's whole reach; one-way for the session's life — a second declaration may only tighten. |
| `approvals` | An `ApprovalPolicy`, below. |
| `name`, `goal` | Conversation title and standing goal. |
| `notifications` | A spawned runtime is silenced by default; `True` inherits the launcher's posture. |

## Isolation is the default

A programmatic session cannot "just happen" to target your real store:

- **Roots are required and explicit.** `SessionRoots(config_dir, agent_home,
  cwd)` has no defaults, and the SDK scopes the environment to them for the
  session's lifetime.
- **The resolved roots are asserted, not assumed.** Construction checks the
  environment actually resolves to the roots you declared.
- **Your uid-default roots are refused** unless you opt in with
  `allow_ambient=True` — a deliberate, greppable acknowledgement for
  single-machine scripts. "Default" is answered from the passwd home, not
  `$HOME`.
- **The model cache is checked by its real resolver too** — if it still points
  at your real home, the run is told to redirect `HOME`, loudly.
- **Roots must be durable.** A store under `/tmp` or `$TMPDIR` can be purged
  mid-run; `allow_volatile=True` is the explicit opt-out.
- **One root per process.** `open_session`, `spawn_session` and `deliver`
  refuse a second, different root while another is live (`allow_multi_root=True`
  is the migration-tool escape).
- **Spawned children get the roots explicitly**, in their environment — HOME set
  to the agent home, launcher variables stripped, notifications silenced unless
  opted in.

## Lifecycle verbs

`abort()` ends a turn; `dispose()` ends an owner (the `async with` does it for
you); a viewer's `interrupt()` is turn-scoped. `request_stop` — the user's kill
switch — is deliberately not exposed: only a person ends a session.

{% cards %}
{% card title="Exec mode" href="/build/exec-mode" icon="terminal-square" %}
The command-line half of the same machinery — flags, JSON events, exit codes.
{% /card %}
{% card title="SSE streaming" href="/build/sse-streaming" icon="radio" %}
Put a runtime behind an event stream, and what that stream carries.
{% /card %}
{% /cards %}
