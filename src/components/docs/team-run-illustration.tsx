import {
	ArrowUp,
	Bot,
	ChevronDown,
	FileCode2,
	FolderOpen,
	MessageSquarePlus,
	PanelRight,
	Plus,
	Search,
	Users,
} from "lucide-react";
import { LogoMark } from "@/components/ui/logo-mark";

const subagents = [
	{
		role: "UX Reviewer",
		status: "Testing",
		task: "Try a declined payment, then retry using only the keyboard.",
	},
	{
		role: "Designer",
		status: "Mapping states",
		task: "Sketch the declined-payment message and show where to retry.",
	},
	{
		role: "Coder",
		status: "Implementing",
		task: "Keep contact and shipping details when payment fails.",
	},
];

/**
 * This is an illustration, not a release screenshot or an interactive demo.
 * Keep the conversation and run details as real text so they stay readable
 * when the illustrated window rearranges on smaller screens.
 */
export function TeamRunIllustration() {
	return (
		<figure className="@container" aria-labelledby="team-run-caption">
			<div className="grid gap-2 overflow-hidden rounded-frame border border-hairline bg-surface p-2 text-body-sm text-ink @[52rem]:grid-cols-[11rem_minmax(0,1fr)]">
				<div className="@[52rem]:px-2 @[52rem]:pt-3">
					<p className="hidden items-center gap-2 font-semibold @[52rem]:flex">
						<LogoMark className="size-5" /> Local Operator
					</p>
					<div
						aria-hidden="true"
						className="my-5 hidden space-y-2 text-ink-muted @[52rem]:block"
					>
						<p className="flex items-center gap-2">
							<MessageSquarePlus className="size-3.5" /> New chat
						</p>
						<p className="flex items-center gap-2">
							<Search className="size-3.5" /> Search
						</p>
					</div>
					<div className="grid grid-cols-2 gap-2 px-2 py-1 @[52rem]:grid-cols-1 @[52rem]:gap-5 @[52rem]:px-0">
						<div>
							<p className="mb-1 flex items-center gap-1 font-mono text-mono-sm text-ink-muted">
								<ChevronDown className="size-3" aria-hidden="true" /> Agents
							</p>
							<ul aria-label="Agents" className="space-y-1 pl-2">
								<li>Manager</li>
								{subagents.map(({ role }) => (
									<li key={role}>{role}</li>
								))}
							</ul>
						</div>
						<div>
							<p className="mb-1 flex items-center gap-1 font-mono text-mono-sm text-ink-muted">
								<ChevronDown className="size-3" aria-hidden="true" /> Teams
							</p>
							<ul aria-label="Teams" className="space-y-1">
								<li className="rounded-sm border-l-2 border-accent bg-accent-wash py-1 pl-1.5 pr-2 font-semibold">
									Product team<span className="sr-only"> (selected)</span>
								</li>
								<li className="pl-2">Docs team</li>
							</ul>
						</div>
					</div>
				</div>

				<div className="min-w-0">
					<ul aria-label="Open conversations" className="flex gap-1 px-1">
						<li className="rounded-t-sm border-b-2 border-accent bg-canvas px-3 py-2 font-semibold">
							Checkout recovery<span className="sr-only"> (active)</span>
						</li>
						<li className="hidden px-3 py-2 text-ink-muted @[36rem]:block">
							Release notes
						</li>
					</ul>

					<div className="grid overflow-hidden rounded-lg bg-canvas @[52rem]:grid-cols-[minmax(0,1fr)_minmax(14rem,28%)]">
						<div className="flex min-w-0 flex-col">
							<p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-hairline px-4 py-3 text-ink-muted">
								<Bot className="size-3.5 shrink-0" aria-hidden="true" />
								<strong className="font-semibold text-ink">Manager</strong>
								<span aria-hidden="true">/</span>
								<Users className="size-3.5 shrink-0" aria-hidden="true" />
								Product team
							</p>

							<div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-5 @[64rem]:px-6 @[64rem]:py-7">
								<div className="max-w-sm self-end rounded-lg bg-elevated px-3.5 py-2.5 text-body">
									<p className="mb-1 text-meta font-semibold text-ink-muted">
										You
									</p>
									<p>
										Improve checkout recovery. Keep entered details if payment
										fails.
									</p>
								</div>
								<div className="space-y-2 text-body">
									<p className="flex items-center gap-2 font-mono text-mono-sm text-ink-muted">
										<FileCode2
											className="size-3.5 shrink-0"
											aria-hidden="true"
										/>
										<span>
											Read <code>checkout.ts</code>
										</span>
									</p>
									<p className="font-semibold">Manager</p>
									<p>
										A declined payment resets the entire form. I’ve split the
										work into three parallel tasks: check the retry flow, design
										the error state, and keep the entered details.
									</p>
									<p className="text-ink-muted">
										The fix is underway. I’ll review their work together and
										wait for your approval before merging.
									</p>
								</div>
							</div>

							{/* The inset is decorative: no live input, focus target, or fake button. */}
							<div
								aria-hidden="true"
								className="mx-auto hidden w-full max-w-xl px-4 pb-4 @[52rem]:block @[64rem]:px-6"
							>
								<div className="rounded-lg bg-surface p-1">
									<p className="flex items-center gap-2 px-2 pb-1 text-meta text-ink-muted">
										<FolderOpen className="size-3.5" /> Working directory:
										checkout
									</p>
									<div className="rounded-md bg-elevated px-3 py-2 text-ink-muted">
										<p>Ask anything. @ adds files, / runs commands</p>
										<div className="mt-2 flex items-center justify-between">
											<Plus className="size-3.5" />
											<ArrowUp className="size-5 rounded-full bg-surface p-1" />
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="border-t border-hairline bg-surface px-4 py-3 @[52rem]:border-t-0 @[52rem]:border-l">
							<p className="flex items-center justify-between gap-2 font-semibold">
								Run details{" "}
								<PanelRight
									className="size-3.5 text-ink-muted"
									aria-hidden="true"
								/>
							</p>
							<p className="mt-2 flex flex-wrap items-center justify-between gap-x-2 text-meta text-ink-muted">
								<span>Subagents</span>
								<span>{subagents.length} running</span>
							</p>
							<ul
								aria-label="Subagents"
								className="mt-1 divide-y divide-hairline"
							>
								{subagents.map(({ role, task, status }) => (
									<li key={role} className="py-3">
										<p className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
											<span className="font-semibold">{role}</span>
											<span className="inline-flex items-center gap-1.5 text-meta text-ink-muted">
												<span
													aria-hidden="true"
													className="size-1.5 rounded-full bg-accent"
												/>
												{status}
											</span>
										</p>
										<p className="mt-1 text-ink-muted">{task}</p>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</div>
			<figcaption
				id="team-run-caption"
				className="mt-3 text-center text-body-sm text-ink-muted"
			>
				Illustrated example: A manager delegates checkout recovery to three
				specialists in parallel.
			</figcaption>
		</figure>
	);
}
