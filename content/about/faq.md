---
description: Short answers to the questions people ask first — privacy, accounts, models, cost, offline use, platforms and updates.
section: about
order: 2
---

# FAQ

Short answers to the questions that come up first. Each one links into the
guide that goes deeper.

## Does my data leave my machine?

Most of it never does. Sessions, files, credentials and configuration stay
in `~/.local-operator/` on your computer, and commands run locally. Two
things can go out, both by design: model requests (to the provider you chose)
and web search / `web_fetch`, which are on by default and can be switched off
(`lop search off`, `lop fetch set enabled off`). With a local model and
search off, no prompt leaves the machine.

## Do I need a cloud account to use it?

No. The runtime never asks you to create an account. You *do* sign in to a
model provider — a subscription login or an API key — or point it at a local
model. A Radient account only comes in if you want to publish to the
[Agent Hub](/capabilities/agent-hub) or share within a team.

## Which models can I use?

- **Subscriptions you may already pay for** — Claude, ChatGPT, Kimi, Grok,
  Z.AI, Qwen — signed in through the browser; multiple accounts per provider
  can pool and rotate.
- **API keys** — Gemini, DeepSeek, Mistral, OpenRouter, Radient, plus
  standard environment variables.
- **Local servers** — LM Studio, Ollama, vLLM, llama.cpp, and any
  OpenAI-compatible URL.

Switch provider or model mid-conversation from the model picker.

## How does it choose between accounts?

Accounts rotate **within the same provider and credential tier**, before the
model fallback chain moves to another provider. An exhausted, revoked or
cooling-down account is not made eligible just because its reset is near.
Every relevant measured shared or model-family allowance still has to permit
use.

`retry.accountSelectionPolicy` chooses the preference among eligible siblings:

- **`reset-soonest`** is the default when neither the canonical policy nor an
  explicit legacy override is stored. Prefer the nearest useful weekly refill,
  so included allowance is less likely to go unused before it resets.
- **`headroom`** prefers the cached quota with the most remaining capacity.
- **`fair`** spreads sessions stably without ranking reset times or headroom.

Reset-soonest uses fresh cached reports, not a new blocking quota probe. Weekly
resets within **60 seconds, inclusive**, of the earliest reset in a bucket use
the five-hour reset as the next preference; five-hour ties use the same inclusive
60-second rule, then stable spreading. Buckets are measured from their earliest
reset, not a chain of neighbouring times. If several weekly allowances apply,
the earliest future refill is useful for preference, but every applicable cap
still gates eligibility.

Unknown weekly timing stays neutral rather than receiving a made-up deadline.
Without comparable weekly evidence, comparable five-hour resets can be used;
without comparable resets, use stable session spreading. Calls without a
session keep the existing round-robin behavior. Reports older than 30 minutes,
past or malformed reset dates, future-dated reports and unsupported windows do
not supply a reset preference. Missing evidence is not proof of an outage or
permission to spend paid credits.

The preference does **not** reorder your provider/model fallback chain, activate
credits, promote a paid credential tier or change the existing reserve and
recovery rules. `/accounts` shows the signed-in pool; `/usage` shows cached plan
windows and account spend.

## Why does a conversation stay on one account?

All three policies first honor a compatible, eligible **account lease from a
successful request**. That keeps a potentially warm provider cache preferred;
it is not an indefinite pointer created just by selecting an account. A failed
or cancelled request, an empty stream, inspecting an account or opening settings
does not renew it. Hard depletion or an incompatible model/cache prefix can
still rule the account out.

The lease starts when the successful request was sent and expires according to
that request's actual cache mode. Anthropic cache markers supply five-minute or
one-hour lifetimes. Supported public OpenAI modes use their documented request
setting/default where known; Codex and legacy chat modes use a bounded
five-minute local heuristic. Unsupported adapters have zero lifetime and create
no affinity lease. **None of these hints guarantees a provider cache hit.**

Expiry re-enters the chosen policy even in an old conversation. Resuming on the
same computer keeps the original expiry, not a new lease; copying a transcript
to another computer does not carry the machine-local account binding with it.
The lease never supplies a previously built request body in place of the
current conversation or language prefix.

## Where can I change account routing?

On a runtime that exposes `retry.accountSelectionPolicy`, open `/settings` in
the terminal, navigate to **Failover and retry**, then **Account selection
policy**. In the desktop app's backend settings, search for
`retry.accountSelectionPolicy`. Choose Reset soonest, Most headroom or Fair
spread. Connected phone controls change the
**selected computer**, not a phone-local preference; an older relay that lacks
the setting cannot confirm a save and must be updated.

A policy save applies to the next unanchored request or expired lease. It does
not evict an already-valid warm lease, reset model/effort fallback pins or clear
unrelated session state. A changed preference therefore need not move the very
next request if it still has a valid lease.

For older configurations only, an explicitly stored strict boolean
`retry.usageAwareAccountPick: true` selects headroom and `false` selects fair,
**only when the canonical policy is absent**. An explicit canonical policy wins
if both exist. New configurations emit the canonical enum; resetting its
settings row clears the legacy override and restores Reset soonest.

The [packaged failover guide](https://github.com/damianvtran/local-operator/blob/main/local_operator/guides/failover/GUIDE.md)
contains the full eligibility, reserve, cache-lifetime and recovery contract.

## What does it cost?

Local Operator itself is free and open source (MIT). Model use is billed by
whichever provider you signed in to — your existing subscription, or your
API usage — and local models cost nothing beyond your hardware.

## Does it work offline?

With a local model, yes: sessions, files, commands and the interface all
work without a network. Cloud models, web search and `web_fetch` need
connectivity.

## Is my code sent anywhere?

Only when a cloud model needs to see it. The agent reads and edits files on
your machine, and when a piece of content is part of the conversation it
travels to your provider the way any prompt would. Approvals gate the
actions, and every tool call leaves a receipt — so it is visible what was
read and when. With a local model, nothing is sent anywhere.

## Which platforms does it run on?

The terminal runtime runs anywhere Python 3.12 or newer runs — macOS, Linux
and Windows. The desktop app ships for macOS, Windows and Linux. Scheduled
wakes are supervised by launchd on macOS, a systemd user service on Linux,
or a Task Scheduler task on Windows.

## How do updates work?

`lop update` — or `/update` inside the TUI — upgrades from PyPI. The desktop
app updates itself from GitHub Releases. Running work is not disturbed: new
code is adopted only once everything is idle. The full matrix is in
[Updating Local Operator](/getting-started/updating).

## Do sessions survive closing the terminal?

Yes. Transcripts persist on disk, and `/resume` brings any conversation back
with its history. Work that has been scheduled keeps going too — wakes fire
with every interface closed, handled by the wake supervisor.

## Can I use it on more than one computer?

Yes. Install on each machine and pair them with the
[Agent Mesh](/capabilities/agent-mesh): sessions on one become reachable
from the other, and a conversation can be handed over — or brought home —
with its transcript.

## Is this only for software work?

No. Code is one use, and a good one — but the same agent does research, file
organization, data cleanup, spreadsheet work and scheduled checks. If you can
describe it to a capable assistant at your computer, it is fair game.

## Can it run things on a schedule while I'm away?

Yes. A session can schedule its own future turns (wakes), and the wake
supervisor starts a runtime when one comes due — even with the terminal
long closed. Missed occurrences are skipped, not replayed, and approvals
still apply unless you opt into unattended execution. Aida, the built-in
chief of staff, is a daily check-in built on the same mechanism — see
[Always-on & proactive agents](/capabilities/always-on).

## How do I stop something it is doing?

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
