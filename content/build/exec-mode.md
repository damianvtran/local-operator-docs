---
description: Run Local Operator headless — one-shot prompts, JSON event streams, background jobs, goal loops, and CI usage.
section: build
order: 2
---

# Exec mode

`lop exec` runs an ordinary conversation without opening a terminal UI. Use it
for scripts, CI jobs, and tasks you start now and check later. The session is
persisted like any other conversation — `lop --resume` reopens it — and the
command is built to compose: final text on stdout, receipts on stderr, and an
exit code that means what it says.

```bash
lop exec "summarize the failures in ./test.log"
```

{% callout type="note" %}
**From inside a session, reach for the `sessions` tool first.** A run an agent
opens for parallel work is spawned with `op=spawn` — a listed workstream by
default, so it shows in your sidebar, `/resume` and phone list. `lop exec`
remains the human CLI, the script interface, and the fallback where the tool is
absent.
{% /callout %}

## What each shape is for

- **One-shot tasks** — a prompt in, a result out: *summarize this*, *review
  this change*, *screen these names*.
- **Scripts and CI** — `--json` emits one JSON line per event for anything to
  process; the exit code tells the surrounding job whether to pass.
- **Long runs** — `--background` detaches a worker with its own log, and
  `--status` reports the durable outcome at any time afterwards.
- **Goal loops** — `--goal` sets a standing objective; `--loop N` runs N
  continuations and `--loop-goal TEXT` keeps going until the goal is judged
  achieved.
- **Hand-offs** — a run started this way is a full session: attach to it from
  any surface, or deliver further work to it (the [Python SDK](/build/python-sdk)
  is the typed way in).

{% diagram name="ExecPipeline" caption="One command in, one headless run out — stdout, stderr, exit code" /%}

## Flags

The full set from `lop exec --help` (common ones first):

| Flag | What it does |
| --- | --- |
| `command` | Literal prompt. `-`, or omitted with piped stdin, reads stdin. Optional when you pass `--loop` or `--loop-goal`. Slash-looking text stays literal. |
| `--resume [SESSION_ID]` | Resume a previous session by id; with no id, the most recent. |
| `--hosting HOSTING` | Provider for this run, e.g. `anthropic`, `openai`, `openrouter`. |
| `--model MODEL` | Model for this run; when omitted, the provider's suggested model is used. |
| `--run-in DIRECTORY` | Working directory to run in. |
| `--team NAME` | Attach a saved team with its manager, roster and briefs. |
| `--profile NAME` | Attach a reusable role or specialist (the `/agent` counterpart). |
| `--tools NAMES` | Comma-separated tools this run may reach, and the only ones. Excluded tools are unreachable by name, not merely unapproved. |
| `--effort LEVEL` | Reasoning effort, validated against the selected model. |
| `--output-format FORMAT` | Enforce the format of the assistant's FINAL response for this run: `markdown`, `json`, `yaml` or `toml`. Bounded by contract: formats, optional schemas and a retry budget only — enforcement is validation plus bounded retry, never a re-encode, and the payload on stdout is the model's own validated bytes. Without this flag no enforcement happens and the run is byte-identical to before the flag existed. See [Final-response enforcement](#final-response-enforcement). |
| `--output-schema PATH` | A JSON file the decoded payload must satisfy: a JSON Schema for `json`/`yaml`/`toml`, or `{"required_sections": ["<section>", ...]}` for `markdown`. Read and validated before the run starts (a bad file fails as `exec failed: …`, exit 1, with no session directory behind it). Requires `--output-format`. |
| `--output-retries N` | Max retries after a rejected final response (0–5; default 2, so three attempts). Not persisted — each `--resume` invocation carries its own flags. Requires `--output-format`. |
| `--name TEXT` | Set the persisted conversation name. |
| `--goal TEXT` | Set a literal standing goal. Unlike the TUI's `/goal`, this does not also send the text as a message — pair it with a prompt or a loop. |
| `--clear-goal` | Clear the resumed standing goal. |
| `--loop N` | Run N continuation iterations after the optional prompt; needs a standing goal. |
| `--loop-goal TEXT` | Continue and judge this goal until achieved; no fixed iteration count. |
| `--background` | Detach the task: spawn a background worker with a log file and exit immediately. |
| `--status JOB_ID` | Read a durable background-job status as JSON. Starts nothing. |
| `--json` | Emit one JSON line per agent event instead of the final text. |
| `--control` | Route approvals and questions to an attached supervisor, which may wait. Without it, non-TTY approvals deny. |
| `--supervisor-fd FD` | Hand this run's operator capability to an inherited descriptor so a supervisor can approve the cards this run parks. Requires `--control`; refused with `--background`. |
| `--yolo` | Auto-approve all tool executions without prompting. An explicit override — never implied by teams, loops or background runs. |
| `--agent`, `--agent-name NAME` | Select a legacy named agent (creates it if missing). |
| `--agent-id ID` | Select an exact existing legacy agent; alternative to `--agent`. |
| `--train` | Use the legacy agent history directory instead of a separate session. `--resume` wins over it. |
| `--workstream` | Publish this run as a long-lived workstream: listed in the sidebar, `/resume` and the phone list, followable and steerable. Without it, a run opened by an agent stays ephemeral — hidden everywhere and silent. Visibility only; it changes no approval handling. |
| `--debug` | Verbose launcher output. |
| `-h`, `--help` | Show every exec flag and the examples without running anything. |

This is a bounded startup interface, not an alias for the TUI's slash commands:
UI commands and configuration-mutating commands are not startup flags.

## Teams, profiles and registered agents

`--team`, `--profile`, `--agent` and `--agent-id` compose a run from parts
supplied on the [Agents & teams](/build/agents-and-teams) page:

```bash
lop exec 'Review the change' --team release --background
printf 'Inspect this report' | lop exec --profile reviewer
lop exec "Draft the migration notes" --agent-id 3d0b0f0e-6a5c-4c96-9a5b-1a2b3c4d5e6f
```

- `--team <name>` attaches a saved team — its manager, roster and briefs — and
  the run starts as that team's manager.
- `--profile <name>` attaches a reusable role or specialist (the `/agent`
  counterpart). `--agent` / `--agent-id` select a registered agent instead — by
  name (created if missing) or by exact id.
- Attachments are resolved against your configuration root before the run
  starts, through the same helper the [Python SDK](/build/python-sdk) uses.

## The prompt, and where output goes

The prompt is the first positional argument. Piped stdin works too — with `-`,
or with no argument at all:

```bash
lop exec "review the change"                        # literal prompt
lop exec - < review-notes.md                        # read the prompt from stdin
printf 'Inspect this report' | lop exec --profile reviewer
```

Foreground runs write the final text to stdout and receipts (session id, log
path, warnings) to stderr, so `lop exec ... > result.txt` gives you the answer
alone. A run that reaches its runtime also prints its session id on stderr:

```console
lop exec session: session_id=d5a8e194bb0c pid=12705 port=61672 record=...
```

That id is the conversation. `lop --resume d5a8e194bb0c` opens it in the TUI
later; a live run attaches instead of replaying.

## Goals and loops

`--goal` sets the objective but sends nothing:

```bash
lop exec 'Finish the checklist' --goal 'Finish the checklist'   # goal + message in one
lop exec --goal 'Finish the checklist' --loop 3 --name 'Night audit'
lop exec --resume SESSION_ID --loop-goal 'Verify every acceptance criterion'
```

`--loop N` counts continuations after the optional initial prompt. `--loop-goal`
has no fixed count: each iteration is judged against the goal and the loop stops
when it is achieved. Saved loop progress stays visible on resume, but iterations
never replay automatically — pass the flag again to start another loop. A goal
with no prompt and no loop is refused rather than silently starting a turn.

## Approvals in a headless run

A non-TTY run cannot ask for approval, so any gated call is denied unless you
say otherwise. The runtime tells you this at launch:

```console
Warning: this run cannot ask for approval (no terminal attached), so any tool call that needs approval will be denied.
  Remedies: --control parks cards for a supervisor; --yolo auto-approves every tier; --tools NAME[,NAME] pre-approves the listed tools and bounds this run's reach to them.
```

- `--tools read,grep,glob` bounds the run's reach and — where nobody can be
  asked — the declaration stands as approval for the listed tools. A tool
  outside the list is unreachable, and delegated children inherit the bound.
- `--control` parks approval cards for a supervisor instead of denying them.
- `--yolo` approves every tier. Reach for it only when you mean it; teams,
  loops and `--background` never imply it.

On a terminal, and under `--control`, the per-call prompt remains: naming a tool
says which tools the run may reach, never that each command it runs was agreed
to in advance.

## Background runs and status

```bash
lop exec "long migration" --background
```

The launcher exits after a bounded readiness check and prints a receipt:

```console
Background job a9bb51b5eea9: running (execution receipt)
Session: bf8ab4473ed3 (the conversation) — attach or resume: lop --resume bf8ab4473ed3
Status: lop exec --status a9bb51b5eea9
Log: ~/.local-operator/logs/exec-20260927-224717-say-hello-a9bb51b5eea9.log
```

The launcher's exit code is **not** the execution result — it only means the
worker detached. Ask for the outcome with `--status`:

```console
$ lop exec --status a9bb51b5eea9
{"id": "a9bb51b5eea9", "started_at": "...", "prompt": "say hello", "log": ".../logs/exec-...-a9bb51b5eea9.log", "pid": 13118, "process_generation": "...", "status": "succeeded", "requested_team": null, "finished_at": "...", "exit_code": 0, "session_id": "bf8ab4473ed3", "team": "", "session_directory": "~/.local-operator/sessions/bf8ab4473ed3", "runtime_path": ".../run/mobile/13118.json"}
```

`status` moves through `starting`, `running`, `succeeded`, `failed`,
`cancelled` and `interrupted`. While a run is parked on an approval it stays
`running` and the record adds `"pending": "approval"` — `lop sessions` shows the
same thing in its `NEEDS` column. The job id names the execution receipt; the
session id names the conversation. They are different things, and both are in
the receipt.

## JSON output

`--json` turns stdout into one JSON object per agent event, each line stamped
with the session id:

```json
{"type": "agent_start", "generation": 1, "session_id": "d5a8e194bb0c"}
{"type": "message_update", "message_id": "a7c67724d3e14...", "delta": "Hello", "session_id": "d5a8e194bb0c"}
```

The turn closes with `message_end`, `turn_end` and a final `agent_end`; a
tool-heavy run streams `tool.start` / `tool.delta` / `tool.end` around the
message deltas. This is the
same projection the [Python SDK](/build/python-sdk) hands to line-oriented
consumers — one serialization, two transports. For a single value out of the
stream:

```bash
lop exec "audit deps" --json > events.jsonl
jq -r 'select(.type == "agent_end") | .messages[-1].content[0].text' events.jsonl
```

## Final-response enforcement

`lop exec` can require the assistant's FINAL response to be a machine-readable
payload and fail the run (exit 1) when it is not. The check runs at the one
point a turn ends cleanly: a rejected response becomes one more model step
**inside the same turn** (the retry notice is an ordinary, persisted user
message, so a resumed transcript explains the continuation), and a run that
exhausts its retries fails loudly rather than printing something wrong.

```bash
lop exec 'Extract the invoice as JSON' --output-format json
lop exec 'Reply with YAML' --output-format yaml --output-retries 3
lop exec 'Draft release notes' --output-format markdown --output-schema sections.json
lop exec 'Parse the report' --output-format json \
  --output-schema report.schema.json --background
```

**What is enforced, per format.** Tolerance is about *locating* the payload;
content is strict.

| format | decoder | strict about | tolerated / noted |
| --- | --- | --- | --- |
| `json` | `json.loads` | full strict JSON: no trailing commas, no single quotes, `NaN`/`Infinity` rejected | any JSON value (object/array/scalar) when the whole text or a fence is exact; a prose scan finds a bare `{`/`[`-anchored span |
| `yaml` | PyYAML safe loader | one document only; the decoded value must be a mapping or sequence (a bare scalar is prose, not a payload) | PyYAML semantics: JSON is a subset, `yes`/`on` are booleans, duplicate keys last-wins, dates decode to dates |
| `toml` | `tomllib` | TOML 1.0 as stdlib enforces it: duplicate keys rejected | trailing commas in arrays; the root is always a table, so the payload is always a mapping |
| `markdown` | none — the text IS the payload | non-empty; balanced fenced code blocks | everything else; markdown has no formal well-formedness |

**Where the payload is found (in this order, first decode that also satisfies
the schema wins):** a fence labelled with the target format; an
unlabelled/unknown-label fence; the whole text; and for `json` only, a bare
`{`- or `[`-anchored span in prose. A fence labelled with a *different*
recognised format is skipped — the label is an explicit claim, and the retry is
the remedy.

**Schemas.** For `json`/`yaml`/`toml`, `--output-schema` names a JSON Schema
file (Draft 2020-12; meta-schema checked before the run). For `markdown` it is
the one vocabulary markdown has: `{"required_sections": ["Summary", "Risks"]}`
— each named section must appear as an ATX heading, case-insensitively, in the
given order.

**Failure semantics.** A rejected attempt logs one dim stderr line
(`! output check failed (<format>, attempt <n>/<m>): <reason>`) and, when the
budget is spent, the run ends with exit 1 and the two stderr lines
`Error: final response did not satisfy the output contract (<format>) after N attempts: <reason>`
and `exec failed: the turn did not complete` (the existing headless failure
line, whose text comes from `exec_session`'s fallback unless a prior prompt
failure recorded a more specific reason). **stdout carries
nothing** for an exhausted turn — a wrong payload on stdout is worse than an
empty one for `… | jq` consumers. On success, stdout is the VALIDATED payload
span (the winning candidate, stripped): `lop exec --output-format json | jq .`
works even when the payload arrived inside a fence or surrounded by prose.

**Interactions.**

- `--json` gains one `output_validation` event per checked attempt
  (`ok`, `attempt`, `max_attempts`, `payload_text` on success); nothing else on
  the event stream changes, and an unenforced run emits none.
- `--loop` / `--loop-goal` enforce **every** turn; a turn that exhausts its
  retries fails the run and stops the loop.
- `--background` is the same request run elsewhere: the schema path is made
  absolute before the spawn, the worker re-validates the file, and a failed run
  reaches the ledger as `failed` (`lop exec --status JOB_ID`), with both stderr
  lines in the job log.
- `--resume` never persists enforcement: the flags of THIS invocation apply,
  and a later resume without them is unrestricted (like `--tools`).
- `--output-retries` counts retries **per turn** (default 2, so three attempts
  per turn); the range is 0–5.

The same contract is available programmatically in the
[Python SDK](/build/python-sdk) — `SessionSpec.output_format`, with optional
`output_schema` and `output_retries`. The local-operator repo's
[`docs/EXEC.md`](https://github.com/damianvtran/local-operator/blob/main/docs/EXEC.md)
is the exec reference.

## Exit codes

- A **foreground** run exits `0` on success and nonzero on failure or
  cancellation. A request the model refuses fails the run:

  ```console
  Error: model refused: I can't help with that request. (stop_reason=mock_refusal)
  exec failed: the turn did not complete
  ```

- A **background launcher** exits after readiness; follow the job's `status`
  and `exit_code` fields for the real outcome. A worker that dies abruptly is
  reconciled as `interrupted`, never reported as success.

## Use it in CI

A CI step is a non-TTY run, so the same rules apply: bound the reach, expect
failures as exit codes, and read the machine-readable stream.

```yaml
- name: Nightly audit
  run: |
    lop exec --goal "Finish the nightly audit" --loop 3 \
      --tools read,grep,glob \
      --name "nightly audit" \
      --json > audit.jsonl
```

- Keep the prompt's reach inside `--tools`; anything outside it is unreachable,
  so a run cannot surprise you with a write tier you did not declare.
- The step fails when the run fails. If you would rather inspect the artifact
  than fail the job, keep the command and check `agent_end` in `audit.jsonl`
  yourself.
- For long jobs, run in the background and poll `lop exec --status` — a CI
  timeout then leaves a resumable conversation behind.

For the wider automations picture — schedules, background jobs and where
final-response enforcement fits in a pipeline — see
[Workflow automations](/capabilities/workflow-automations).

{% cards %}
{% card title="Python SDK" href="/build/python-sdk" icon="code" %}
The typed surface for scripts: open or spawn sessions, deliver prompts, stream events.
{% /card %}
{% card title="SSE streaming" href="/build/sse-streaming" icon="radio" %}
How a runtime is embedded behind an event stream, and Local Operator's own endpoints.
{% /card %}
{% /cards %}
