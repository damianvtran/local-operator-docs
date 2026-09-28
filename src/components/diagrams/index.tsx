import type { ReactNode } from "react";
import { AidaCadence } from "./aida-cadence";
import { EcosystemMap } from "./ecosystem-map";
import { ExecPipeline } from "./exec-pipeline";
import { HubPublishFlow } from "./hub-publish-flow";
import { MeshPairingFlow } from "./mesh-pairing-flow";
import type { DiagramProps } from "./primitives";
import { RelayFlow } from "./relay-flow";
import { SchedulePipeline } from "./schedule-pipeline";
import { SdkLifecycle } from "./sdk-lifecycle";
import { SessionHandoff } from "./session-handoff";
import { SseSequence } from "./sse-sequence";
import { SurfaceMap } from "./surface-map";

/**
 * The diagram registry — the one place a `{% diagram name="…" /%}` tag maps
 * to a component.
 *
 * The names are frozen (content and the manager's wiring pass reference them):
 * an unknown name renders a visible fallback frame and warns, so a typo shows
 * up in the build log and in the page, never as a silently missing figure.
 * Each entry's `description` doubles as the SVG's accessible description when
 * the tag carries no caption.
 */
export type DiagramEntry = {
	title: string;
	description: string;
	Component: (props: DiagramProps) => ReactNode;
};

export const DIAGRAMS: Record<string, DiagramEntry> = {
	SurfaceMap: {
		title: "Surface map",
		description:
			"One runtime, many ways in: the terminal, desktop app, mobile relay, browser extension, exec mode and Python SDK all drive the same sessions and read the same configuration.",
		Component: SurfaceMap,
	},
	SessionHandoff: {
		title: "Session handoff",
		description:
			"Moving a session between two paired devices: the receiving device issues the move, the transcript and id travel with it, and the source copy retires once the handoff commits.",
		Component: SessionHandoff,
	},
	RelayFlow: {
		title: "Mobile relay",
		description:
			"The mobile relay: the phone reaches a loopback-only session daemon through a secure path the user puts in front — Cloudflare Tunnel + Access, or Tailscale.",
		Component: RelayFlow,
	},
	MeshPairingFlow: {
		title: "Mesh pairing",
		description:
			"Mesh pairing: a single-use invite token becomes a 6-digit code and a fingerprint that a person compares on both devices before the keys are approved.",
		Component: MeshPairingFlow,
	},
	SchedulePipeline: {
		title: "Wake pipeline",
		description:
			"A scheduled wake: the schedule lives with the session; a live runtime fires it, and the wake supervisor starts one when nothing else is running.",
		Component: SchedulePipeline,
	},
	AidaCadence: {
		title: "Aida's cadence",
		description:
			"Aida's day: one check-in at 09:00 local that reports only what needs action, plus a bounded allowance of extra check-ins she can ask for.",
		Component: AidaCadence,
	},
	HubPublishFlow: {
		title: "Agent Hub publish flow",
		description:
			"Publishing an agent: your machine, moderation, then the Agent Hub registry — and a pull on another machine that needs no key.",
		Component: HubPublishFlow,
	},
	ExecPipeline: {
		title: "Exec pipeline",
		description:
			"lop exec in one picture: one headless task, stdout for the result (or one JSON event per line with --json), stderr for receipts, and the exit code as the outcome.",
		Component: ExecPipeline,
	},
	SdkLifecycle: {
		title: "Python SDK lifecycle",
		description:
			"The Python SDK lifecycle: provide a spec, roots and an approval policy; open, spawn or deliver; subscribe to events before prompting; close on the terminal event.",
		Component: SdkLifecycle,
	},
	SseSequence: {
		title: "SSE sequence",
		description:
			"An event-stream subscription: frames carry monotone ids, a reconnect resumes with Last-Event-ID, and the stream ends only on a terminal frame.",
		Component: SseSequence,
	},
	EcosystemMap: {
		title: "Ecosystem map",
		description:
			"What surrounds the runtime: skills, MCP servers, teams, model providers, the Agent Hub and the community.",
		Component: EcosystemMap,
	},
};

export function getDiagram(name: string | undefined): DiagramEntry | undefined {
	return name ? DIAGRAMS[name] : undefined;
}

/**
 * The `{% diagram %}` tag renderer: caption below, frame around, fallback
 * when the name is unknown.
 *
 * The frame deliberately matches the Figure component's shape (rounded,
 * hairline border, caption in muted small type) so a diagram and a screenshot
 * read as the same kind of object. An unknown name is a content bug, so it
 * is not silent: the fallback names the missing diagram on the page, and the
 * warning lands in the build log when Next renders the page statically.
 */
export function Diagram({
	name,
	caption,
}: {
	name?: string;
	caption?: string;
}) {
	const entry = getDiagram(name);
	if (!entry || !name) {
		if (name) {
			console.warn(
				`[diagram] unknown name "${name}" — add it to src/components/diagrams/index.tsx (rendering the fallback frame)`,
			);
		}
		return (
			<figure className="lo-bleed flex min-h-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-hairline p-8 text-center text-body-sm text-ink-dim">
				<span className="text-ink-muted">
					{name ? `Missing diagram: ${name}` : "Missing diagram"}
				</span>
				{caption ? <span>{caption}</span> : null}
			</figure>
		);
	}
	const Component = entry.Component;
	return (
		<figure className="lo-bleed">
			<div className="rounded-lg border border-hairline bg-surface p-4 sm:p-6">
				<Component
					title={entry.title}
					description={caption ?? entry.description}
				/>
			</div>
			{caption ? (
				<figcaption className="mt-2 text-center text-body-sm text-ink-dim">
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
