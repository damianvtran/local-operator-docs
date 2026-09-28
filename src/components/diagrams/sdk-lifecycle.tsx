import {
	Arrow,
	Chip,
	type DiagramProps,
	DiagramSvg,
	Panel,
	Txt,
} from "./primitives";

/**
 * SdkLifecycle — the typed session-engagement surface, end to end.
 *
 * Three bands: what you provide (a spec, explicit roots, an approval policy),
 * the entry points that act on it, and the lifecycle itself — open, subscribe
 * to events BEFORE prompting (they are not replayed), run the turn, and close
 * on the prompt's terminal event.
 */
export function SdkLifecycle({ title, description }: DiagramProps) {
	return (
		<DiagramSvg viewBox="0 0 720 520" title={title} description={description}>
			<Panel x={30} y={60} w={660} h={108}>
				<Txt x={46} y={84} className="fill-ink text-body-sm">
					What you provide
				</Txt>
				<Panel x={46} y={96} w={196} h={60}>
					<Txt x={60} y={120} className="fill-ink text-body-sm">
						SessionSpec
					</Txt>
					<Txt x={60} y={138} className="fill-ink-muted text-meta">
						model · hosting · tools
					</Txt>
				</Panel>
				<Panel x={262} y={96} w={196} h={60}>
					<Txt x={276} y={120} className="fill-ink text-body-sm">
						SessionRoots
					</Txt>
					<Txt x={276} y={138} className="fill-ink-muted text-meta">
						config_dir · agent_home · cwd
					</Txt>
				</Panel>
				<Panel x={478} y={96} w={196} h={60}>
					<Txt x={492} y={120} className="fill-ink text-body-sm">
						ApprovalPolicy
					</Txt>
					<Txt x={492} y={138} className="fill-ink-muted text-meta">
						refuse · auto · declared · …
					</Txt>
				</Panel>
			</Panel>

			<Panel x={30} y={188} w={660} h={108}>
				<Txt x={46} y={212} className="fill-ink text-body-sm">
					Entry points
				</Txt>
				<Panel x={46} y={224} w={196} h={60}>
					<Txt x={60} y={248} className="fill-ink font-mono text-mono-sm">
						open_session
					</Txt>
					<Txt x={60} y={266} className="fill-ink-muted text-meta">
						own · attach
					</Txt>
				</Panel>
				<Panel x={262} y={224} w={196} h={60}>
					<Txt x={276} y={248} className="fill-ink font-mono text-mono-sm">
						spawn_session
					</Txt>
					<Txt x={276} y={266} className="fill-ink-muted text-meta">
						detached runtime
					</Txt>
				</Panel>
				<Panel x={478} y={224} w={196} h={60}>
					<Txt x={492} y={248} className="fill-ink font-mono text-mono-sm">
						deliver
					</Txt>
					<Txt x={492} y={266} className="fill-ink-muted text-meta">
						id or @latest
					</Txt>
				</Panel>
			</Panel>

			<Panel x={30} y={316} w={660} h={124}>
				<Txt x={46} y={340} className="fill-ink text-body-sm">
					Lifecycle
				</Txt>
				<Chip x={46} y={354} w={134} h={36} text="open" />
				<Arrow from={[180, 372]} to={[212, 372]} />
				<Chip x={212} y={354} w={134} h={36} text="subscribe" />
				<Arrow from={[346, 372]} to={[378, 372]} />
				<Chip x={378} y={354} w={134} h={36} text="prompt()" mono />
				<Arrow from={[512, 372]} to={[544, 372]} />
				<Chip x={544} y={354} w={134} h={36} text="agent_end" mono />
				<Txt x={46} y={412} className="fill-ink-dim text-meta">
					the stream never ends on its own — break on agent_end, then aclose()
				</Txt>
			</Panel>

			<Txt x={360} y={468} anchor="middle" className="fill-ink-dim text-meta">
				isolation defaults: explicit roots · volatile roots refused · one root
				per process
			</Txt>
		</DiagramSvg>
	);
}
