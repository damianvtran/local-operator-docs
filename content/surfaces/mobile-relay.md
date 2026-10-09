---
description: Check on, steer, and start sessions from your phone — a preview of the mobile relay guide.
section: surfaces
order: 3
draft: true
---

# Mobile relay

{% callout type="note" %}
**Preview.** The full mobile-relay guide is being written. What follows is
the shape of it; the relay itself ships today.
{% /callout %}

`lop mobile install` runs a supervised session daemon (a LaunchAgent on
macOS). Every interactive session registers with it, so from your phone you
can watch what a session is doing, steer it with a message, or start a new
one — the same sessions that are running on your desk machine. (You can also
just ask the agent: *"set up phone access"*.)

{% figure src="/shots/reuse/mobile-session-view.png" alt="A session on a phone: streamed transcript with collapsed tool rows, the composer reading 'steer this turn', and a stop button." caption="A session from the phone: the transcript streams, tool rows collapse, and the composer steers the running turn." /%}

- `lop mobile status` — daemon health
- `lop mobile password` — set the relay password
- `lop mobile logs` — what the daemon has been doing

From the phone you can watch transcripts stream, steer a running turn,
switch model and reasoning effort, run slash commands, drill into subagents,
and start new sessions. Approval prompts from phone-started sessions are
answered on the phone — sessions started at the terminal still answer at
the terminal.

{% diagram name="RelayFlow" caption="From the phone to a loopback-only daemon, through a path you put in front" /%}

The relay is loopback-only by design: for access away from home, put a
tunnel in front of it (a Cloudflare Tunnel with Access, or Tailscale) and
leave the daemon bound to `127.0.0.1`. The full guide will cover the tunnel
setup, the security model, and the phone UI surface by surface.

A native client for this relay, [Local Operator Mobile](/surfaces/mobile-app),
is in development — platform sign-in, and a layout built for a phone rather
than adapted to one.
