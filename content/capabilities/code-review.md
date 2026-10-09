---
description: See every pull request and merge request a session opened or mentioned, with CI and review-round progress, in the Code review tab — and ask for it with the code_requests tool.
section: capabilities
order: 5
---

# Code review

A coding session leaves a trail of pull requests and merge requests — ones it
opens, ones it comments on or merges, ones it only reads about. **Code review**
keeps that trail for each session and answers the question the transcript
makes you scroll for: *which code requests did this conversation touch, and
where is each one up to?*

It has three parts:

- **Tracking** — Local Operator notices the code requests a session touches
  and records how the session relates to each one.
- **Status** — for GitHub and GitLab, it reads each request's state, checks
  and review comments, including the review rounds your team posts.
- **Where you see it** — a **Code review** tab in the desktop app, and a
  read-only `code_requests` tool the agent itself can call.

{% callout type="note" %}
**Availability.** The Code review tab appears only when the runtime you are
connected to reports the capability, so an older runtime shows the app exactly
as it was. Status for a request needs a login on its forge (see
[Supported forges](#supported-forges)); without one, the request still shows up
as a link.
{% /callout %}

## Opened, mentioned, or unknown

Each code request is classified by how *this session* met it. The distinction
matters because a session that opened a pull request owns it, and one that only
saw it in a log does not.

| Relation | What it means |
| --- | --- |
| **Opened** | This session's own tool call created it, proven from the tool result — a `gh pr create` or `glab mr create` that answered with the new request. A subagent's open counts, and the row says `via subagent <name>`. |
| **Mentioned** | The request appears in the conversation — you pasted it, the agent read it, a command listed it — but nothing in this session created it. |
| **Unknown** | The evidence is ambiguous: a script ran, a pull request URL appeared in its output, and nothing proves the script created it. The row reads `unknown — possibly opened`. Local Operator does not guess either way. |

Two more tags refine the picture without replacing it:

- A request the session **acted on** without opening — it commented, reviewed,
  pushed, marked ready or merged — carries a `you commented`, `you merged`
  style tag, so a pull request opened elsewhere and merged here is not
  mistaken for a mention.
- A **forked** session keeps the requests it inherited from its parent and
  marks them `inherited`; the fork did not open them.

In the tab, **Opened** collects everything the session owns or may own —
opened, unknown, acted-on and inherited rows — and **Mentioned** holds the
rest. Requests that only ever appeared inside tool output, such as a long
audit listing, are collapsed and not counted, so a session that scanned a
hundred pull requests does not bury the three it worked on.

## How a review cycle reads

If your team reviews with agents, the review rounds live in the pull request's
comments. Code review reads that convention, so you see where a request is up
to without opening it. It looks for headings of the form:

```markdown
### Agent review — round 2
Reviewer: <agent and model>
Scope: <base>..<head>
```

answered by `### Agent review remediation — round 2`. The same shape covers
the other lanes: **Design review**, **QA report** and **UX review**, each with
its own `… remediation` reply. The lanes are labelled **Code** (the agent
review), **Design**, **QA** and **UX** in the tab.

For each lane you get the **current round**, a **state**, and a **freshness**:

| State | Reads as |
| --- | --- |
| Awaiting review | No review comment in this lane yet — `No agent review yet` |
| Findings open | The latest round's verdict reports findings |
| Remediation posted | A remediation reply followed the review: `Round 2 · remediation posted · awaiting re-review` |
| Clean | The latest round's verdict is clean or approved |
| Terminal | The latest verdict is clean *and* names itself terminal — the reviewer's final word |
| Reviewed, verdict not stated | A round was posted but its verdict could not be classified — reported as unstated, never invented |

Freshness compares the commit a review names against the request's current
head. The review is **fresh** when the head starts with the reviewed SHA (at
least seven hex characters), **stale** when it does not — the row then shows
both, as `stale — reviewed a3ffd2b, head 9d29452` — and **unknown** when the
comment names no commit. Unknown is shown as unknown, not guessed at.

Two things the reader deliberately does not do. It never uses the comment's
author to judge whether a review was independent — a shared forge account
makes that meaningless — so the `Reviewer:` text is reported verbatim and
nothing is inferred from it. And it does not judge whether a later push only
carried unrelated fixes; whether a stale review still stands is your call.

## The Code review tab

In the desktop app, **Code review** is a tab on the right-hand rail, listed
beside the run, browser, console and canvas tabs. It is there whenever you are
in a session, including when there is nothing to show yet — an empty tab says
so — and a dot marks it when an opened request has findings
open or failing checks.

Each row shows:

- the repository and number (`#123` on GitHub, `!45` on GitLab), with the
  relation tag where it needs one;
- a state pill — **Open**, **Draft**, **Merged** or **Closed**;
- the title;
- one segmented strip per review lane, a segment per round, with the lane's
  state beneath;
- the CI result (`23/23 passed`, `2 failing`, `CI pending`, `No checks yet`),
  the comment count and when it was last refreshed.

Click a row to open the request in your system browser. The tab's refresh
button re-reads the session's requests on demand.

A **count chip** in the composer's status row, beside the other status chips,
shows how many code requests the session has (`3 code requests`). It appears
once there is at least one visible request, its tooltip splits the count into
opened and mentioned, and clicking it reveals the tab.

When a read goes wrong the tab says so in place and keeps the last known data:
a row that could not refresh reads `Couldn't refresh —` followed by the
reason, and a host that is rate-limiting you shows `GitHub rate-limited until
14:05.` Nothing is lost; the session's own record is unchanged.

## Supported forges

| Forge | Support |
| --- | --- |
| GitHub, including GitHub Enterprise | Full — state, comments, review rounds, CI |
| GitLab, including self-hosted | Full — state, comments, review rounds, pipeline status |
| Gitea, Forgejo, Codeberg, Bitbucket, Azure DevOps, Gerrit | **Detect and link** |

**Detect and link** means Local Operator recognises the request, lists it, and
opens it when you click — but fetches no state, so there is no pill, CI
result or review progress. It is the honest floor: you still see that the
session touched it. Hosts are identified from the URL's shape, the
repository's git remotes and the hosts you have logged in to, never from the
hostname alone, so an unrecognised self-hosted server stays a link rather than
being guessed at.

Status is fetched with **your own logins** — the GitHub CLI (`gh auth login`)
and GitLab CLI (`glab auth login`) sessions already on the machine, or a
`GITLAB_TOKEN` secret for GitLab. Tokens are held in memory and never
displayed. If there is no usable login, or the forge rejects it, the row falls
back to a link and names the remedy; it never turns into an error wall.

Reads are cached and revalidated conditionally, so repeated looks are cheap,
and a rate-limited host is left alone until its window reopens. The runtime
runs no background poller: rows refresh when the session acts on a request,
when the app window regains focus, and — only while the tab is visible and a
turn is running or checks are pending — about once a minute. A row that could
not refresh keeps its last known data, marked stale.

## For the agent: the `code_requests` tool

The same data is available to the model as a read-only tool, `code_requests`,
so it can answer questions about a session's pull requests from the tool's
parsed view rather than re-deriving it from `gh` and `glab` output:

- **`list`** — this session's rows with their relation, state and link.
  It reads only what is already known and never waits on the network.
- **`show <ref>`** — one request in full: state, CI, each lane's round, state
  and freshness, and quoted excerpts of the review comments. `ref` is any
  request URL or a qualified reference such as `owner/repo#123` or
  `group/project!45`, including one the session never saw — such a lookup is
  answered but not added to the session's record. If the cache is cold, `show`
  waits a few seconds for one fetch.

Comment text is remote and untrusted, so the tool quotes it inside a fence as
data and never as instructions. The tool is read-only: comments, merges and
pushes still go through `gh` and `glab`.

Because it is observation-only, it can be watched. Ask the agent to *tell you
when the review on this pull request goes clean*, and it can arm a
`monitor(code_requests show <ref>)` rather than polling by hand. When a
request URL first appears in a session, the agent is also given a one-line
pointer to the tool.

Agents learn when to use it from a packaged guide, `guide://code-requests`: use the
tool when the question is about *this session's* work or about review rounds,
and fall back to `gh` or `glab` for what it does not carry — a diff, a file,
or an action.

{% cards %}
{% card title="Desktop app" href="/surfaces/desktop" icon="monitor" %}
The right-hand rail, run details and the rest of the window the tab lives in.
{% /card %}
{% card title="Always-on & proactive agents" href="/capabilities/always-on" icon="clock" %}
Wakes and monitors — the way to be told when a review moves.
{% /card %}
{% /cards %}
