---
description: Embed an agent runtime behind a Server-Sent Events stream — endpoint shape, event taxonomy, resuming with Last-Event-ID, keepalives, and working examples.
section: build
order: 3
---

# SSE streaming

If you run agents behind your own product, something has to carry the run's
trajectory to a browser: text arriving token by token, tools opening and
closing, approvals waiting. This page is the shape for that transport, drawn
from a service that runs it in production — endpoint, frames, event taxonomy,
resume, keepalives and terminal handling — with the names stripped so you can
build your own. At the end, what Local Operator itself ships on this front.

{% callout type="note" %}
Why Server-Sent Events rather than a WebSocket: the trajectory is a one-way
fan-out, and control actions already have ordinary authenticated HTTP
endpoints. SSE rides the web stack you already run — no upgrade handshake, no
control plane — and reconnects are a protocol feature, not something you
build.
{% /callout %}

{% diagram name="SseSequence" caption="Subscribe, keep the last event id, reconnect with Last-Event-ID" /%}

## The endpoint

```
GET {base}/v1/runs/{runId}/events/stream
```

- **Response**: `200 text/event-stream`, `Cache-Control: no-cache`,
  `X-Accel-Buffering: no` (the last one tells nginx and friends not to buffer).
- **Query parameters**: `after_sequence` (an integer cursor — "send me events
  after this one") and, in richer modes, an opaque `cursor`. Both resume
  strategies are described below.
- **Status codes**: `400` for a physically malformed resume value, `401` when
  the caller is not authenticated (no body), `404` for a run the caller cannot
  see — deliberately sanitized, so a scope mismatch and a missing run are
  indistinguishable and the route cannot be used as a run-existence oracle.
- **Auth**: one credential per caller class, compared in constant time, plus
  capability scope headers validated against the run's persisted owner. Repeat
  the resource id inside the scope so a valid capability cannot be replayed
  against a different run, and authorize once at connect — not per poll tick.

## Frames

Three field lines per data frame, one blank line to end it:

```
: connected

retry: 1000

id: 42
event: run.item.delta
data: {"event_id":"evt_9f3","run_id":"run_01HXYZ","sequence":42,"event_type":"run.item.delta","payload":{"type":"item.delta","delta":"…"},"created_at":"2026-09-27T22:47:17Z"}

: heartbeat
```

- **`id:`** is the resume token — a monotone sequence number for this run.
- **`event:`** is the event name; the JSON body repeats it as `type` / `event_type`
  so a raw `fetch` consumer never has to correlate the two halves of a frame.
- **`data:`** is one JSON envelope. Keep a `sequence` inside the body too, so a
  buffering client can persist its position without tracking the header.
- **Comment frames** (`: connected`, `: heartbeat`) carry no event name. They
  keep proxies and stall detectors happy; `EventSource` discards them, so a
  client that needs to *see* a liveness tick should get a real event (Local
  Operator's own transport emits `keepalive` as an event for exactly this).
- **`retry:`** is an optional reconnection hint, in milliseconds. Emit it once.

## The event taxonomy

Names are dotted, stable, and shaped `<subject>.<single-lifecycle-word>`.
Three families plus stream-level frames:

| Family | Examples | When |
| --- | --- | --- |
| `run.turn.*` | `run.turn.started`, `run.turn.completed` | The model loop's iteration boundaries. |
| `run.item.*` | `run.item.started`, `run.item.delta`, `run.item.output_delta`, `run.item.completed`, `run.item.failed` | One thing the turn is doing: a message streaming, a tool call running. |
| `run.approval.*` | `run.approval.required`, `run.approval.resolved` | A gate is waiting on a person, then answered. |
| stream-level | `run.terminal`, `error`, the comment frames | The run finished; the stream failed. |

Normalize provider-native event names into this vocabulary at the edge, before
anything downstream sees them — consumers should match your names, not a
vendor's. Adding richer families later (reasoning deltas, compaction markers)
is fine as long as old consumers can ignore what they do not know.

## Resume, and why reconciliation beats validation

The client reconnects with `Last-Event-ID` (the browser's `EventSource` sends
it automatically) or a query cursor. When both are present and disagree, take
the **larger** — the header is current while the URL may hold the cursor the
stream originally opened with, and replaying from the stale one duplicates
everything in between. Only physically impossible values are a `400`; a
spec-shaped client reconnecting is normal, and rejecting it fails every native
auto-reconnect.

- **Ordering**: one monotone sequence per run, enforced by a unique constraint,
  so a page cursor never skips or repeats.
- **Delivery**: at-least-once. Clients dedupe with `max(last_seen_sequence)`.
- **The richer mode** uses an opaque, self-describing cursor (base64url JSON
  bound to the run and owner digest, strictly parsed). A cursor from another
  run fails closed; that is the point of binding it.

## Keepalives and backpressure

- **Heartbeat** every 15 s, under the common 60 s proxy idle cutoff. Local
  Operator's own transport reports the same 15 s cadence in its capabilities
  document.
- **No per-connection buffer.** Catch-up is pulled in bounded pages (this
  design: 500 records and a 4 MiB payload budget per page) directly from the
  log, and the socket write itself is the throttle: a blocked write fails once
  and ends that stream — never retried, never buffered.
- **Poll cadence** for a log-backed implementation: 250 ms is plenty, and
  continue immediately while pages remain rather than waiting a tick.
- **Terminal detection is the hard part.** Events signal liveness, but a run
  that ends without writing one would leave the panel "thinking" forever, so
  probe the run's status on an idle stream — at most once per second,
  immediately after any page that carried events.

## Terminal and error frames

- When a run reaches a terminal status (`completed`, `failed`, `cancelled`),
  send one terminal frame (`run.terminal`) and close. The frame's payload can
  carry the final cursor and metadata; don't make the client infer anything
  from the close itself.
- A mid-stream failure sends one generic `error` frame — a fixed message, no
  internals — then closes cleanly.
- **Write failures are invisible to the client** (the 200 already went out;
  the client just sees end-of-body). Log them with the run id and frame kind,
  and count them, or "the client went away" and "we gave up on a slow client"
  are indistinguishable in production.

## A server sketch

The pattern end to end: an append-only per-run log, a fan-out for listeners,
resume by sequence, and a keepalive ticker. Python + FastAPI here; the shape
ports to any stack.

```python
import asyncio
import json

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse

app = FastAPI()
RUNS: dict[str, "RunLog"] = {}

HEARTBEAT_S = 15.0   # under the common 60 s proxy idle cutoff


class RunLog:
    """Append-only per-run event log, with wake-ups for its open streams."""

    def __init__(self) -> None:
        self.events: list[dict] = []          # sequence = index + 1
        self.listeners: set[asyncio.Event] = set()

    def publish(self, event_type: str, payload: dict) -> None:
        self.events.append({
            "sequence": len(self.events) + 1,
            "event_type": event_type,
            "payload": payload,
        })
        for event in self.listeners:
            event.set()

    def since(self, cursor: int, limit: int = 500) -> tuple[list[dict], bool]:
        page = [r for r in self.events if r["sequence"] > cursor][:limit]
        return page, bool(page) and page[-1]["sequence"] < len(self.events)


@app.get("/v1/runs/{run_id}/events/stream")
async def stream(run_id: str, request: Request, after_sequence: int = 0):
    log = RUNS.setdefault(run_id, RunLog())

    # Resume: accept both forms; the larger cursor wins (the header is current
    # on an EventSource reconnect, while the URL may hold the opening cursor).
    header = request.headers.get("Last-Event-ID") or ""
    cursor = max(after_sequence or 0, int(header) if header.isdigit() else 0)
    wake = asyncio.Event()
    log.listeners.add(wake)

    async def frames():
        nonlocal cursor
        yield ": connected\n\n"
        yield "retry: 1000\n\n"
        while True:
            if await request.is_disconnected():
                return
            wake.clear()                       # clear first: anything new re-arms it
            page, more = log.since(cursor)
            for record in page:
                cursor = record["sequence"]
                yield f"id: {cursor}\nevent: {record['event_type']}\n"
                yield "data: " + json.dumps(record, separators=(",", ":")) + "\n\n"
                if record["event_type"] == "run.terminal":
                    return
            if more:
                continue                       # keep draining; do not wait
            try:
                await asyncio.wait_for(wake.wait(), timeout=HEARTBEAT_S)
            except asyncio.TimeoutError:
                yield ": heartbeat\n\n"

    return StreamingResponse(
        frames(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
```

Two things a long-lived version adds, and it should: trim the replay window
(and answer an over-old cursor with a `stream.gap` frame that tells the client
to reconcile over REST rather than silently resume from the wrong place), and
probe run status on idle streams so a finished run closes without a terminal
write.

## Clients

**Browser — `fetch` with a manual cursor.** Full control: you set the resume
header yourself and own the backoff.

```js
async function followRun(runId, onEvent) {
  let cursor = 0, attempt = 0;
  for (;;) {
    const url = `/v1/runs/${runId}/events/stream?after_sequence=${cursor}`;
    let res;
    try {
      res = await fetch(url, { headers: cursor ? { "Last-Event-ID": String(cursor) } : {} });
      if (!res.ok || !res.body) throw new Error(`stream failed: ${res.status}`);
      attempt = 0;
    } catch {
      attempt += 1;
      await new Promise((r) => setTimeout(r, Math.min(15000, 250 * 2 ** attempt)));
      continue;                                  // reconnect with the same cursor
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, sep).split("\n");
        buffer = buffer.slice(sep + 2);
        let name = "message", data = "";
        for (const line of block) {
          if (line.startsWith(":")) continue;             // comment / keepalive
          const idx = line.indexOf(":");
          const field = line.slice(0, idx);
          const value = line.slice(idx + 1).trimStart();
          if (field === "id") cursor = Number(value);     // resume token
          else if (field === "event") name = value;
          else if (field === "data") data += value;
        }
        if (name === "run.terminal") return;
        if (name === "error") throw new Error("stream error");
        if (data) onEvent(name, JSON.parse(data));
      }
    }
  }
}
```

**Browser — `EventSource`, if you want the browser to reconnect for you.**
The trade: no custom request headers, and its built-in retry is immediate on
some server-close shapes — which hammers a dying server. Close it and reopen
with your own backoff when that matters. Frame parsing is the same; the
`Last-Event-ID` header is sent for you.

**Python client** — same loop, `httpx.stream`:

```python
import json, time, httpx

def follow(base: str, run_id: str, token: str):
    cursor, attempt = 0, 0
    while True:
        headers = {"Authorization": f"Bearer {token}"}
        if cursor:
            headers["Last-Event-ID"] = str(cursor)
        try:
            with httpx.stream("GET", f"{base}/v1/runs/{run_id}/events/stream",
                              headers=headers, timeout=None) as res:
                res.raise_for_status()
                attempt = 0
                event, data = None, []
                for line in res.iter_lines():
                    if line == "":                       # frame boundary
                        if data:
                            payload = json.loads("".join(data))
                            if event == "run.terminal":
                                return
                            yield event, payload
                        event, data = None, []
                    elif line.startswith(":"):
                        continue                         # comment / heartbeat
                    else:
                        field, _, value = line.partition(":")
                        if field == "id":
                            cursor = int(value)
                        elif field == "event":
                            event = value
                        elif field == "data":
                            data.append(value)
        except httpx.HTTPError:
            attempt += 1
            time.sleep(min(5.0, 0.25 * 2 ** attempt))    # 250 ms x 2^n, capped 5 s
```

## Local Operator's own streaming surfaces

The runtime ships SSE on its server (`lop serve`, loopback by default — the
server has no authentication of its own, so keep it there or front it with
access controls), and the same design is what the desktop app and the phone
relay speak:

- `GET /v1/sse/jobs/{job_id}` — the one to prefer: it can be opened the instant
  a turn is submitted, before any record exists.
- `GET /v1/sse/messages/{message_id}` — for a message whose id you already hold.
- `GET /v1/sse/capabilities` — transport negotiation: `preferred: "sse"`, the
  resume contract (`Last-Event-ID` and `?after_seq`, larger wins, 256-frame
  replay buffer), the 15 s heartbeat, and the full event list.

Its event vocabulary is the same idea with its own names — `stream.open`,
`stream.gap` (frames were lost; reconcile over REST), `stream.terminal`, plus
`message.delta`, `reasoning.delta`, `tool.start`/`tool.delta`/`tool.end`,
`turn.start`/`turn.end`, `agent.start`/`agent.end`, `notice`,
`steering.delivered`, `compaction.*`, `retry.*` and `job.status`. And the phone
relay streams whole-state repaints over SSE (never a WebSocket, by design —
its client reconnects with its own backoff rather than trusting the built-in
retry).

{% cards %}
{% card title="Python SDK" href="/build/python-sdk" icon="code" %}
Drive sessions from Python and consume the same event stream, typed.
{% /card %}
{% card title="Exec mode" href="/build/exec-mode" icon="terminal-square" %}
The JSON event stream `lop exec --json` emits, line for line.
{% /card %}
{% /cards %}
