---
description: Pair your machines into one network so sessions can reach agents on other devices — roles, grants, onboarding, and incident controls.
section: capabilities
order: 3
---

# Agent Mesh

A mesh pairs your devices into one network, so a session on your laptop can
see — and hand work to — sessions on another machine: the always-on box at
home, the workstation at the office, a teammate's machine with the right
access.

{% figure src="/shots/tui/mesh-empty.png" alt="The mesh panel on a fresh device: no identity yet, no networks, no peers, relay not running, and the next command named wherever there is one." caption="A fresh device: the mesh panel names the next command wherever there is one." /%}

## Pairing

One device creates the network and mints a single-use invite; the other joins
with it. Both steps end at the same place: a human on each screen comparing
what they see before anything is admitted.

On the first device:

```bash
lop network init <name>
```

That binds `0.0.0.0:4097` by default. A device that should only dial out
passes `--listen-address 127.0.0.1` and is reachable only where it connects.

```bash
lop network invite --role read --expires 30m
```

`--role` is `read`, `drive` or `admin`; `--expires` is how long the token
stays open; `--device <id>` binds it to one device id so only that device may
redeem it. The token is written to a 0600 file and the command prints only
the path — never paste the token itself anywhere.

On the second device:

```bash
lop network join @<token-file>
```

Joining shows six digits. Compare them with the code the inviting side shows,
and confirm only if they match. `--verify` compares the 160-bit fingerprint
instead. Three bad tries burn the invite. When nobody is at the keyboard,
`--park` starts the pairing and waits: the inviting side answers the queue
with `lop network confirm <invite-id>`, the joining side finishes with
`join --confirm <code>`. No agent path can complete the comparison — that is
the interlock, not a gap.

{% diagram name="MeshPairingFlow" caption="A token, a code, and a person comparing the two" /%}

Before admission, a credential share list names what the new device will be
given: each credential reads `will be served` or `not offered`. The owner may
only remove rows from that list, and the joined receipt names the final set.

{% figure src="/shots/tui/mesh-panel.png" alt="The mesh panel after pairing: this device, two networks with roles and member counts, peers with reachability, and a running relay." caption="Paired: networks with their roles, peer reachability, and relay health in one panel." /%}

## Roles and grants

A role decides what a member may do on your device:

- `read` sees: it can list and view sessions.
- `drive` adds the controls: list, view, prompt, steer, stop and slash.
- `admin` holds the full vocabulary, including membership changes.

Moving, deleting and starting unattended work are **per-member grants**, not
role-exclusive:

```bash
lop network member grant <network> <device-id> move
lop network member grant <network> <device-id> delete
lop network member grant <network> <device-id> unattended
```

`admin` carries these by construction; the grants are how a non-admin member
gets one of them without the whole role. `lop network member revoke <network>
<device-id> <capability>` takes a grant back. `unattended` is what lets a
session start with no approval card at all.

## Onboarding another machine

Approval records are how one machine gets set up to reach another:

```bash
lop network approvals list
lop network approvals show <apn_id>
lop network approvals request --host <host> --network <network>
lop network approvals approve <apn_id>
lop network approvals deny <apn_id>
lop network approvals withdraw <apn_id>
lop network approvals run <apn_id>
```

Since 0.84.6 the signed **network-only** enrollment is the narrow path: it
joins the mesh and provisions no logins, tools or account access.

```bash
lop network approvals request --network-only \
  --host <host> --network <network> --credential-ref <ref>
lop network approvals approve-network-enrollment <apn_id> \
  --request-digest <digest>
lop network approvals run <apn_id>
```

A desktop client that advertises `mesh_onboard: 1` exposes the same
restricted path.

Readiness is a separate question from membership:

```bash
lop network ready --peer <device> --json
```

Do not offload work on a `FAIL`. A `warn` marks equipment that is reported
without holding the verdict — missing, but not required for onboarding.

## Across devices

- **Sessions across devices** — `lop network sessions --peer <peer>` lists
  what that device is running; `--all-peers` merges every peer's list.
  `--create` starts one there, `--send` delivers a turn, `--steer` injects
  into a running turn, `--peek` watches, `--stop` ends it.
- **Move a conversation** — `lop sessions move <id> --to <peer>` hands it
  over, and `--to local` brings it home. The session keeps its id and its
  transcript; the copy on the device it left is deleted unless `--keep` is
  given, which leaves the original running and mints a new id for the copy.
  `--wait` blocks for the receipt. A wake travels with the move; monitor
  state does not. A turn in flight refuses the move rather than being
  interrupted.
- **From the TUI** — `/new remote <peer>` starts a session on another device,
  and `/move --to <peer|local>` moves the current one.

{% figure src="/shots/tui/mesh-new-remote.png" alt="The /new remote picker listing paired devices with their network and role." caption="Starting a session on another device: the picker lists the peers you can reach." /%}

{% figure src="/shots/tui/sidebar-peers.png" alt="The session sidebar with a remote device's sessions grouped under a heading naming that device." caption="Remote sessions in the sidebar, grouped under the device that owns them." /%}

## Trust and incidents

- **Removing a member** — `lop network member rm <network> <device-id>`
  revokes it and rotates the shared secret. A removed member that wants back
  in needs `lop network identity rotate` first.
- **Leaving** — `lop network disconnect` stops trusting the network, closes
  links and deletes the local secret; the audit trail stays.
- **An incident** — `lop network panic` broadcasts a revoke, rotates the
  secret, bumps the epoch and marks the network untrusted here. Every other
  device must be re-admitted before it can connect again.
- **Re-admitting** — `lop network trust <network> --active` marks the network
  active again on this device.
- **Diagnosis** — `lop network doctor`, `lop network log` and
  `lop network status` answer reachability, epoch and install-state
  questions, and `lop network peers` shows what is reachable right now.
