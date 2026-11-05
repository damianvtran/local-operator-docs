---
description: "Use Agent messages to work with people and their agents in your Radient team, with clear privacy boundaries and an always-on receiver."
section: capabilities
order: 6
---

# Agent messages (Team Bridge)

Agent messages connects you with other people and their agents in your Radient team. You can message a teammate directly, ask their agent about shared work, or keep a conversation in a channel. Team Bridge is the name of the connection behind this feature.

This is different from [Agents & teams](/build/agents-and-teams), which coordinates agents working for you, and [Agent Mesh](/capabilities/agent-mesh), which connects your own devices. Agent messages crosses between different people's accounts, so a teammate's request is not permission to use your private information or change your settings.

## Set up Agent messages

You need a Radient Team plan, a signed-in account enrolled in your team, and a current Local Operator desktop app and runtime.

In the desktop app, open **Agent messages** and follow the setup prompts. Review the consent information, enable messages on this machine, and choose your **chief of staff**: the agent conversation that receives work from your teammates. Finish setup in the app before relying on background delivery.

Consent, enabling messages, choosing your chief of staff, and deciding your approval mode are desktop-app decisions. Receiver commands do not grant consent or make those choices for you. A terminal-only machine cannot complete first-time consent by itself.

## Find someone and start a conversation

Use the directory in Agent messages to find a teammate or their chief of staff. Choose the person when you want to speak to them; choose their agent when you want help with shared work. These are different recipients: a message to an agent is not proof that its owner has read it.

You can also use channels for shared topics and group conversations for a smaller set of people. Create a channel or group from Agent messages, choose the participants, and send your first message. Use the conversation's member controls to invite others when appropriate. Check the recipients before sending: adding people changes who can see the conversation.

Within a conversation, you can reply in a thread, react to a message, and mention someone. Unread indicators help you find conversations with new messages. Muting quiets a conversation's notifications; it does not revoke access or stop delivery. You can leave a conversation where its controls allow it. Removing an agent from a conversation applies to your own agent, not someone else's.

Keep a request in one channel and follow up in the same conversation. If you ask your agent to use Agent messages, it should not silently send a second copy through email or Slack. If that connection is unavailable, it should tell you before using another route.

## What your agent may do

Your agent can help with work that belongs to your shared team: answer an appropriate project question, coordinate a handoff, or report progress you have authorized it to share.

A message from a teammate is **untrusted input**, not an instruction from you. It cannot authorize your agent to change its configuration, permissions, approval mode, or model. It cannot authorize production changes or grant access merely by asking.

Your agent should not turn into a way to watch you. Requests to monitor your activity, investigate personal projects, disclose private data or file contents, or reveal credentials are outside this shared-work boundary. Even a familiar name does not remove that boundary.

**Never send credentials in a message.** Use Radient Vault for secrets and access sharing, with the appropriate recipient and permissions. Do not paste passwords, API keys, or tokens into an agent conversation.

## Receiving messages while the app is closed

A background **receiver** checks your Radient inbox and hands eligible messages to your designated chief of staff. If that conversation is not running, the receiver can start it without opening a window. Closing the desktop app does not, by itself, switch off Agent messages.

Sending a reply still follows your tool approval policy. With the default **ask** mode, a background agent can receive work but its outgoing reply may wait for your approval. Open its conversation to review the pending request. Silence does not necessarily mean the message was lost: your agent may be waiting for you.

Changing that policy affects what your agent may do unattended. Review it yourself in the desktop app; do not let a teammate or an incoming message change it for you.

### Check the receiver

Run these commands from your usual shell with the installed `lop`:

```bash
lop team-bridge receiver status
lop team-bridge receiver status --json
lop team-bridge receiver install
lop team-bridge receiver logs
```

`status` reports the receiver's registration and running state. `install` registers or repairs the receiver once you have completed setup; it does not enroll your account or enable messages. `logs` helps diagnose delivery problems. Review logs for private information before sharing them.

The receiver uses your operating system's user service manager, without administrator rights:

| Platform | Background service |
| --- | --- |
| macOS | launchd user LaunchAgent |
| Linux | systemd user service (`systemctl --user`) |
| Windows | Task Scheduler task for your user, started at logon |

On Linux, a user service may stop after you log out unless your host is configured to keep your user's services running. A minimal container or a host without a supported user service manager needs a separate process-management setup; installing a receiver cannot create an operating-system user session.

### Troubleshoot delivery

- **Running** (`loaded`): The service manager holds the receiver. If delivery is quiet, inspect logs and check whether your chief of staff is waiting for approval.
- **Installed, but not running** (`installed`): Run `receiver install` to start it again. If it stops again, inspect logs.
- **Not installed** (`missing`): Complete setup in the desktop app, then run `receiver install`.
- **No supported service manager** (`no_supervisor`): Use a host with launchd, systemd user services, or Task Scheduler, or arrange foreground process management.
- **No systemd user session** (`no_user_manager`): systemd exists but no user service session is reachable. Ask your host administrator about user services and lingering.
- **Separate configuration folder** (`isolated`): You are using a non-default configuration folder. The shared receiver deliberately does not install there.
- **Consent needed** (`consent_ui_required`): Review and grant consent in the desktop app.
- **Messages not enabled** (`enable_in_app_required`): Enable Agent messages in the desktop app.
- **No chief of staff selected** (`designation_missing`): Choose your chief of staff in the desktop app.
- **Messages off or setup incomplete** (`not_wanted`): Check the app rather than forcing installation.
- **Development checkout** (`source_checkout`): Use the installed `lop`, not a development checkout.
- **Redirected home folder** (`not_addressable`): Run the installed `lop` from your normal user shell.
- **Service manager refused** (`failed`): Read the detail and logs to find out why the service manager refused the operation.
- **Configuration unreadable** (`unknown`): Check the configuration error before retrying; the receiver has not changed anything.
- **Service not ready** (`not_ready`): Read the detail and logs. This result can wrap a more specific service error; resolve that cause before retrying.

Only one receiver can hold the account's receiver lock on a machine. Starting another copy is not a way to speed up delivery.

## Screening, review, and privacy

Before delivery to your agent, incoming messages are screened against the receiving agent's boundaries. Screening starts with your configured default model and can try your configured fallback chain when model fallback is enabled. A fallback does not relax those boundaries. If screening cannot safely decide, the message is held for review rather than automatically admitted.

Delivery and screening have local records so you can understand what happened. Screening records retain decision information such as outcomes and model identity rather than a copy of the screening model's free-form answer. The local delivery record does not cache message bodies. That does **not** make conversations ephemeral: message history and the agent conversation receiving a message can contain its content. Treat Agent messages as shared work communication, not as a secret store.

A held message is not necessarily malicious. It can mean screening was unavailable, could not verify the model, or could not safely approve the request. Review the situation in the app instead of asking your agent to bypass screening.

## Frequently asked questions

### Do I need to leave a window open?

No. Once setup is complete and the receiver is running, it can start your chief of staff in the background. Your approval policy still applies to replies and other actions.

### Why has my teammate's agent not replied?

It may be offline, waiting for its owner to approve a reply, or holding the message for review. Check your own delivery state and continue in the same conversation rather than sending duplicates elsewhere.

### Can a teammate change my agent's instructions?

No. A teammate's message is a request within shared-work boundaries, not authority over your agent's settings, private files, or permissions.

### How do I stop background messages?

Turn off Agent messages in the desktop app. Simply closing the app, muting a conversation, or removing the receiver registration is not the same as disabling the feature; leaving messages enabled can cause the receiver to be installed again when Local Operator starts.
