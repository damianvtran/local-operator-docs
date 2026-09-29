---
description: Browse Radient's community registry of agents, pull one into your setup, publish your own, and share privately with a team.
section: capabilities
order: 4
---

# Agent Hub

The Agent Hub is Radient's public registry of community agents — a shelf of
taught agents you can pull down and add to your own setup. Browsing and
pulling are public; publishing takes a Radient account.

## Browse the hub

In the desktop app, the **Agent hub** page is the browse surface:
"Discover and download community agents on Radient". Categories on the left,
search and sorting on top, and cards that carry each agent's description,
tags, likes, favourites and download count. The **Get** button pulls the
agent without leaving the page.

{% figure src="/shots/ui/agent-hub-light.webp" alt="The Agent hub page in the light theme: category rail on the left, agent cards with descriptions, tags, likes and Get buttons." caption="The Agent hub: categories on the left, community agents with Get buttons." /%}

{% figure src="/shots/ui/agent-hub-dark.webp" alt="The same Agent hub page rendered in the dark theme." caption="The same page in the dark palette." /%}

The registry is also a public API — `GET https://api.radienthq.com/v1/agents`
— the same list the page renders.

## Pull an agent

```bash
lop agents pull --id "<agent_id>"
```

No key needed: pulling is public. The agent lands in your Local Operator
setup, ready to use in a session or to be added to a team. Pulled agents keep
a link home: `lop agents sync` brings hub-pulled agents (and installed
starters) up to their latest published text — `lop agents sync --name <name>`
for one, `--force` to also replace a copy you edited locally.

## Publish an agent

Publishing needs a [Radient account](https://console.radienthq.com/signup)
(sign-up is free). One credential does it:

```bash
lop credential update RADIENT_API_KEY   # masked prompt
lop agents push --name "My Agent"
```

Your agent is published as an instruction-set document, and moderation runs
server-side before it appears. The same command updates or repoints an agent
you already published, and refusals are specific — a taken name, a reserved
name, or a moderation failure each says which.

{% diagram name="HubPublishFlow" caption="Push through moderation, then pull anywhere with no key" /%}

## Share privately with a team

Org sharing puts agents and teams in front of your teammates — and nobody
else. Org content is **visibility: org**: visible to members of that
organization, never listed on the public hub, and not fetchable by id from
outside.

- **Sign in first:** `lop login radient`. Org calls act as *you* (your
  signed-in account), not as a machine key.
- **`--org` takes the organization's tenant id.** Not sure of it? Run the
  command once without `--org`: it prints your memberships — name, tenant id,
  role and plan — and returns, so no default org is ever guessed for you. The
  [Radient console](https://console.radienthq.com)'s Team page shows the same
  membership.
- **Publish and pull with the org target:**

  ```bash
  lop agents push --name "My Agent" --org <tenant_id>
  lop agents pull --id "<agent_id>" --org <tenant_id>
  lop teams push <team> --org <tenant_id>
  lop teams pull --org <tenant_id> <team_id>
  ```

  Pushes print the id to share — `Team ID: …` for a team, `Agent ID: …` for
  an agent; that id is what a teammate pulls with.
- **Teammates pull the same way.** They sign in (`lop login radient`), need
  membership in the organization — an owner or admin invites them from the
  console's Team page — and then pull by id with `--org <tenant_id>`. A pulled
  team arrives with its roster and both briefs, ready to run with `/team <name>
  <request>` (see [Agents & teams](/build/agents-and-teams)).
- Roles are `owner` / `admin` / `member`, and refusals are explicit —
  `not_a_member`, `insufficient_role`, and `team_plan_required` each name the
  next step (invite, ask an admin, activate the plan) instead of failing
  silently.

The desktop app's Agent hub page carries the same org browsing, team pulls and
org-targeted publishing when you would rather click than type.

## The Radient side: plan and billing

Org sharing sits behind the Radient **Team plan** — sign up or activate it at
[console.radienthq.com](https://console.radienthq.com), whose Team page manages
the plan, members, invites and billing. Billing is handled in the console —
nothing about the plan is billed through Local Operator itself.

{% callout type="tip" %}
You do not need a Radient account to use Local Operator, and you do not need
one to pull agents from the hub. The account only comes in when you want to
publish, or to share within a team.
{% /callout %}

{% cards %}
{% card title="Desktop app" href="/surfaces/desktop" icon="monitor" %}
The Agent hub page, projects, schedules and the rest of the window.
{% /card %}
{% card title="Agent Mesh" href="/capabilities/agent-mesh" icon="network" %}
Sharing across your own machines — a different plane from the hub.
{% /card %}
{% /cards %}
