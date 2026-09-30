---
description: Schedule future turns, run background jobs, and let work continue after you walk away — a preview of the automations guide.
section: capabilities
order: 1
draft: true
---

# Workflow automations

{% callout type="note" %}
**Preview.** The full automations guide is being written. These primitives
ship today; the guide will cover each one end to end.
{% /callout %}

{% diagram name="SchedulePipeline" caption="A scheduled wake, fired with or without a terminal open" /%}

- **Scheduled wakes that survive a closed terminal.** The agent's `wake`
  tool schedules a future turn ("check the build again in 30 minutes").
  Schedules persist with the session, and a small wake supervisor starts a
  runtime when a session's wake is due — even if the terminal that
  scheduled it is long gone. `lop wake status` shows the next due wake and
  whether the supervisor is running.
- **Background jobs that report back.** `task` always runs in the
  background, `bash` can (`background=true`), and every settled job
  auto-delivers its result when the session is idle. `jobs` peeks at new
  output since your last look.
- **`lop exec --background`** detaches a whole task with a log file and exits
  immediately — the building block for cron jobs and CI steps. An agent asked
  for separate parallel work opens the same kind of run with the `sessions`
  tool (`op=spawn`), as a listed workstream by default.

A nightly loop, a build watcher, a research sweep that reports in the
morning: all of them are the same three primitives arranged differently.

Schedules are visible where they run — a wake panel in the TUI, a Schedules
page in the desktop app:

{% figure src="/shots/tui/wake-panel.png" alt="The wake panel above the TUI composer: two scheduled wakes with their next time, recurrence and message." caption="The wake panel in the TUI: what this session has scheduled, before it fires." /%}

{% figure src="/shots/ui/schedules-light.webp" alt="The desktop app's Schedules page: each task with its next run, cadence and run count." caption="The same schedules in the desktop app, with run history." /%}

Aida, the built-in chief of staff, is the same machinery on a daily cadence
— see [Always-on & proactive agents](/capabilities/always-on).
