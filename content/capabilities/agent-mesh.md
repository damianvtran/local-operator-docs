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

{% figure src="/shots/tui/mesh-empty.png" alt="The mesh panel on a fresh device: no identity yet, no networks, no peers, relay not running, and the next command named for each." caption="A fresh device: the mesh panel names the next command at every step." /%}

## Pairing

Pairing is a shared-secret handshake with a human on both keyboards: one
device mints a **single-use invite**, the other joins with it and derives a
6-digit code plus a fingerprint, and a person compares them with what the
inviting side shows before confirming. An agent can drive the joining side
up to that compare — no agent path can complete a pairing, and that is a
designed interlock, not a gap.

<!-- diagram: MeshPairingFlow -->

{% figure src="/shots/tui/mesh-panel.png" alt="The mesh panel after pairing: this device, two networks with roles and member counts, peers with reachability, and a running relay." caption="Paired: networks with their roles, peer reachability, and relay health in one panel." /%}

## What you can do across devices

- **Sessions across devices** — list the sessions a peer is running, start
  one there (`/new remote <peer>`, or `lop network sessions --peer <peer>
  --create` from a shell), or send it a task.
- **Roles, not guesswork** — `read` means see, `drive` adds prompting and
  steering, and `admin` adds moving, deleting and membership changes.
- **Hand off.** Move a conversation between devices with its transcript
  intact and bring it home the same way — the session keeps its history,
  todos and tool trail wherever it runs.

{% figure src="/shots/tui/mesh-new-remote.png" alt="The /new remote picker listing paired devices with their network and role." caption="Starting a session on another device: the picker lists the peers you can reach." /%}

{% figure src="/shots/tui/sidebar-peers.png" alt="The session sidebar with a remote device's sessions grouped under a heading naming that device." caption="Remote sessions in the sidebar, grouped under the device that owns them." /%}

## Staying in control

- **Trust is explicit** — a device you have not admitted sees nothing, and
  you can revoke access per device: `lop network member rm <network>
  <device>` rotates the shared secret and withholds it from the removed
  device.
- **Leaving is a command, not a hope** — `lop network disconnect` stops
  trusting the network, closes links, and deletes the local secret; the
  audit trail stays.
- **An incident has one command** — `lop network panic` broadcasts a
  revoke, rotates the secret, and marks the network untrusted here; every
  other device must be re-admitted before it can connect again.
- **Compare what you can see** — never type a pairing code you did not see
  on the other device's screen, and never print an invite token.

Until the full guide lands, `lop network --help` (and `lop mesh --help`, if
your build spells it that way) is the reference.
