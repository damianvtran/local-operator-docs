---
description: Check on, steer, and start sessions from your phone — how the relay reaches your computer, how to set it up, and what the phone can do.
section: surfaces
order: 3
---

# Mobile relay

The mobile relay is how a phone reaches the Local Operator sessions running
on your computer. Nothing runs on the phone: a small daemon on the machine
serves the phone pages and relays control to the same sessions the terminal
and the desktop app see. A path from the internet to that daemon — a tunnel —
is what puts it in your pocket.

## What `lop mobile install` sets up

`lop mobile install` installs the daemon as a supervised service: a
LaunchAgent on macOS, a `systemd --user` unit on Linux, and a Task Scheduler
task on Windows. The unit name is fixed and owns its port, so a second daemon
fails to bind loudly instead of splitting the control plane. When the web
bundle is absent, the install builds it.

Every TUI and `exec` session publishes a 0600 discovery record under a 0700
directory, so the phone sees terminal sessions too, not only the sessions the
daemon started.

## Set it up

There are two ways to reach the daemon from outside the machine. The Radient
personal tunnel is the recommended path: it carries the authentication, so
there is no relay password to copy. The local-password path is for a tunnel
or URL you run yourself.

### A Radient personal tunnel

{% steps %}
{% step title="Sign in" %}
Check which account this machine is signed in with:

```bash
lop login-status
```

Then sign in — or create the account — with `/login radient` in a session.
{% /step %}
{% step title="Read the plan" %}
```bash
lop tunnel setup --json
```

This is a read-only plan: it observes and changes nothing. It checks the
selected account and its billing as they stand, that a new enrollment would
have positive credit, that `cloudflared` is at least 2025.4.0, and that this
computer runs a user supervisor the relay supports. Follow whatever blockers
it names — one common one is an explicit `lop mobile install` for the phone
origin.
{% /step %}
{% step title="Apply only when told to" %}
When the plan is ready it prints the apply command:

```bash
lop tunnel setup apply --credential-id <id>
```

Add `--accept-monthly-price <amount>` only for the exact quote you accepted —
never a guess. The CLI shows you the price; this page does not quote one.
{% /step %}
{% /steps %}

If the tunnel already exists in the Radient console, connect it instead:

```bash
lop tunnel connect <id> --credential-id <id>
```

Setup is finished when all of these hold: the mobile health check passes, the
auth gate is closed, the connector is running, the gateway answers, and the
cloud route is active and fresh. The tunnel URL is returned only then; a plan
that stops early names the check that blocked it.

{% diagram name="RelayFlow" caption="From the phone to a loopback-only daemon, through a path you put in front" /%}

### A tunnel or URL you run yourself

Install the daemon and set the password it will ask for:

```bash
lop mobile install
lop mobile password
```

On a host with no user service supervisor (some containers), run
`lop mobile serve` instead.

Then put an identity gate in front of the loopback daemon — the tunnel's own
access policy, or a reverse proxy that authenticates. Never widen the daemon's
bind address, and never expose it through an anonymous quick tunnel.

## Commands

| Command | What it does |
| --- | --- |
| `lop mobile status` | Daemon health, the auth gate and live sessions |
| `lop mobile start` / `stop` / `restart` | Move the supervised service between states |
| `lop mobile logs --lines N [--follow]` | The daemon's and its runtimes' logs |
| `lop mobile password` | Show or rotate the password (interactive only) |
| `lop mobile devices` | The push-device registry: `list`, `revoke <device-id>`, `unrevoke <device-id>` |
| `lop mobile uninstall [--purge]` | Remove the service; `--purge` also deletes the password |
| `lop mobile serve --port 4098` | Run the daemon in the foreground |

`lop mobile devices revoke <device-id>` and `unrevoke <device-id>` are the
human path: `revoke` blocks that installation until you `unrevoke` it —
registering again does not clear a revoke. A device marked `expired` is
cleared by registering again, not by unrevoking it.

## What the phone can do

{% figure src="/shots/reuse/mobile-session-view.png" alt="A session on a phone: streamed transcript with collapsed tool rows, the composer reading 'steer this turn', and a stop button." caption="A session from the phone: the transcript streams, tool rows collapse, and the composer steers the running turn." /%}

The phone is a controller, not a second agent. From it you can:

- watch a transcript stream, with tool rows collapsed as they finish;
- steer a running turn with a message, or stop it;
- switch the session's model and reasoning effort;
- run the session's slash commands;
- drill into its subagents;
- start a session or resume an existing one;
- answer the approval and ask cards a phone-started session raises —
  sessions started at the terminal still answer at the terminal.

Schedules are read-only on the phone. Projects support the writes you need
away from the desk: create one, add or complete a milestone.

## Security invariants

- The daemon is loopback-only. It is not a server you expose; the tunnel is.
- Transport is HTTP with server-sent events, never a WebSocket.
- The password never appears on a command line or in a log. It lives in the
  platform's own secret store — Keychain on macOS, the Secret Service (or a
  0600 file) on Linux, DPAPI on Windows — with `LOP_MOBILE_PASSWORD` as the
  container override and an interactive prompt otherwise.
- Cookies are signed with a key derived from the password, so rotating the
  password invalidates every existing session.
- Discovery records are 0600, under a 0700 directory.

## The native app

A native client for this relay, [Local Operator Mobile](/surfaces/mobile-app),
is still in development: there is no App Store, TestFlight or Google Play
build, and no GitHub Release. It speaks the same relay described
here, so the computer side of this page is what it connects to.
