---
description: Pair your machines so sessions can reach agents on other devices — a preview of the Agent Mesh guide.
section: capabilities
order: 3
draft: true
---

# Agent Mesh

{% callout type="note" %}
**Preview.** The full Agent Mesh guide is being written. Pairing is done
from the CLI today; the guide will cover roles, trust, and incident
controls.
{% /callout %}

A mesh pairs your devices into one network, so a session on your laptop can
see — and hand work to — sessions on another machine: the always-on box at
home, the workstation at the office, a teammate's machine with the right
access.

The moving parts, at a glance:

- **Pairing** — one device invites, the other joins with a short code; each
  side approves the other's key.
- **Sessions across devices** — list the sessions a peer is running, start
  one there, or send it a task.
- **Trust is explicit** — a device you have not admitted sees nothing, and
  you can revoke access per device.

Until the full guide lands, `lop network --help` (and `lop mesh --help`, if
your build spells it that way) is the reference.
