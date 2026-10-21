---
description: Schedule future turns, watch for changes, and run work in the background — the wake, monitor and job primitives, plus machine-readable output.
section: capabilities
order: 1
---

# Workflow automations

Local Operator has three ways to keep work moving when you are not sitting at
the keyboard: **wakes** schedule a future turn, **monitors** watch something
and report when it changes, and **background jobs** run work alongside the
session. Each is a tool the agent can call and a CLI form you can script. A
fourth primitive, output modes, turns a run's final response into something a
pipeline can parse.

{% diagram name="SchedulePipeline" caption="A scheduled wake, fired with or without a terminal open" /%}

## Wakes

A wake is a scheduled future turn. The agent arms one with the `wake` tool
("check the build again in 30 minutes"), and the schedule is durable with the
session — it survives a closed terminal, and a wake supervisor starts a
runtime when the session's wake comes due.

```bash
lop wake status
lop wake list
lop wake create <session> "in 2h" "re-run the deploy smoke tests" --every 1d --until "in 7d"
```

`lop wake status` reports whether a supervisor is installed, what it would
fire next, and what is owed. It names the supervisor's state — running,
stopped, not loaded, not installed, unverifiable, unsupported — and says what
comes next. `lop wake install` repairs or rolls out the supervisor now;
`lop wake serve --once` runs one pass in the foreground.

`lop wake create` takes the session id, when to fire (a duration such as
`"in 2h"` or a clock time such as `"at 09:30"`), and the message it delivers.
It accepts `--every 1d` for a recurrence, `--until "in 7d"` for an end, `--limit N`
for a fire count, and `--notify` to ask for a notification when the wake's
turn completes. Give `--until` a future or relative time; an absolute date
you copied from an example will expire.

The supervisor is installed on demand: arming a wake sets it up, and a machine
that never schedules one never runs it. On macOS it is a LaunchAgent
(`com.local-operator.wakes`), on Linux a `systemd --user` service, on Windows
a Task Scheduler task.

The honest details:

- **Missed occurrences are skipped, not replayed.** A laptop asleep for six
  hours owes one hourly check, not six.
- **A fire that cannot be delivered is owed, not lost.** It is recorded and
  retried with backoff, and `lop wake status` shows what is owed.
- **Unattended turns respect approvals.** A wake that fires while you are away
  waits at the first approval prompt until you answer — from the phone or
  `/resume`. `/approvals auto` or `--yolo` is how you opt into unattended
  execution.

{% figure src="/shots/tui/wake-panel.png" alt="The wake panel above the TUI composer: two scheduled wakes with their next time, recurrence and message." caption="The wake panel in the TUI: what this session has scheduled, before it fires." /%}

## Monitors

A monitor watches a read-only call on an interval and reports only when the
result changes — a build status, a file, an endpoint. The interval has a
30-second floor and a 60-second default. Set `notify` when the user asked to
be told; without it the delta lands in the conversation and waits for the next
turn.

```bash
lop monitor status
lop monitor cancel <session> <id>
```

`lop monitor status` lists every monitor on the machine, soonest first. There
is no supervisor: a monitor runs while its session's runtime is open. That is
also why `lop monitor cancel` exists — it is for a session with no runtime
open. A live session changes its own monitors from inside.

## Background jobs

Background work is how one session does several things at once:

- **Child sessions.** The `task` tool runs a subagent in the background;
  `sessions` with `op=spawn` opens one as a listed workstream by default.
- **Background tool calls.** `bash` and `eval` accept `background=true` and
  return a job id immediately.
- **Inspection.** `jobs` lists, peeks at new output since your last cursor,
  and cancels. `wait` blocks until a job settles or a message arrives.
- **Delivery.** A settled job's result is delivered automatically when the
  session is idle — but a result already consumed by `wait` stays quiet
  rather than arriving twice.

From a shell, `lop exec --background` detaches a whole task with a log file
and exits immediately; `lop exec --status <JOB_ID>` reads it back as JSON.

## Where the schedules show up

Schedules are visible where they run — a wake panel in the TUI, a Schedules
page in the desktop app:

{% figure src="/shots/ui/schedules-light.webp" alt="The desktop app's Schedules page: each task with its next run, cadence and run count." caption="The same schedules in the desktop app, with run history." /%}

Aida, the built-in chief of staff, is the same machinery on a daily cadence
— see [Always-on & proactive agents](/capabilities/always-on).

## Output modes

When a run's result feeds another system, prose is a parsing problem. `lop
exec` can enforce the assistant's final response as a machine-readable
payload — JSON, YAML, TOML or markdown, with an optional schema — and retry
inside the same turn when the response does not conform. It is **off by
default**: without a flag, nothing about a run changes.

A schema is a plain JSON file the decoded payload must satisfy:

```json
{
  "type": "object",
  "required": ["status", "items"],
  "properties": {
    "status": { "type": "string" },
    "items": { "type": "array", "items": { "type": "string" } }
  }
}
```

Point a run at it, and consume the result directly:

```bash
lop exec "Check the nightly build; reply as JSON" \
  --output-format json \
  --output-schema build-check.schema.json \
  --output-retries 2 | jq -r '.items[]'
```

- On success, stdout is the validated payload span — stripped of any fence or
  prose around it, in the model's own bytes.
- A rejected attempt logs one stderr line — `! output check failed (json,
  attempt 1/3): …` — and the reason is fed back for the retry, inside the
  same turn.
- When the retry budget is spent (default 2 retries, so three attempts), the
  run exits 1 and stdout stays empty: a wrong payload is worse than an empty
  one for `… | jq` consumers.

The other formats are one flag away — `--output-format yaml` and
`--output-format toml` — and markdown takes
`{"required_sections": ["Summary", "Risks"]}` as its schema: each named
section must appear as a heading, in order. The [exec
mode](/build/exec-mode#final-response-enforcement) page owns the per-format
strictness table and the extraction rules.

The same contract is available to scripted automations through the
[Python SDK](/build/python-sdk):

```python
from pydantic import BaseModel
from local_operator.sdk import SessionSpec


class Invoice(BaseModel):
    total: int
    currency: str


spec = SessionSpec(
    output_format="json",   # enforce the final response, every turn
    output_schema=Invoice,  # model class, dataclass, TypedDict or JSON Schema
    output_retries=1,       # 0-5; default 2 (three attempts per turn)
)
```

The checked span arrives as an `output_validation` event (`payload_text` on
success) — the same event a `--json` run emits for each checked attempt.

## A worked example

A nightly loop that only speaks when something is wrong:

```bash
# One wake per morning, this week only; notify when the turn completes.
lop wake create <session> "at 07:30" \
  "Check the overnight build. If it failed, name the job and the first error." \
  --every 1d --until "in 7d" --notify
```

A build watcher is a monitor instead: ask the agent to watch the build log
and tell you when it changes, and it arms a read-only monitor with `notify`
set. For work that should not hold the session open, detach it and read the
result back:

```bash
lop exec "Run the release checklist and write the report" --background
lop exec --status <JOB_ID>
```

All three are the same three primitives arranged differently: when to run,
what to watch, and where the result goes.
