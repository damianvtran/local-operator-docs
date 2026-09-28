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
one — the same sessions that are running on your desk machine.

- `lop mobile status` — daemon health
- `lop mobile password` — set the relay password
- `lop mobile logs` — what the daemon has been doing

The relay is loopback-only by design: for access away from home, put a
tunnel in front of it (a Cloudflare Tunnel with Access, or Tailscale) and
leave the daemon bound to `127.0.0.1`. The full guide will cover the tunnel
setup, the security model, and the phone UI surface by surface.
