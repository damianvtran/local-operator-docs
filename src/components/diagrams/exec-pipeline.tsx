import {
	Arrow,
	Chip,
	type DiagramProps,
	DiagramSvg,
	Panel,
	Txt,
} from "./primitives";

/**
 * ExecPipeline — one command in, one headless run out.
 *
 * The output contract is the diagram: stdout carries the result (final text,
 * or one JSON line per agent event with --json, session_id stamped on every
 * line), stderr carries chrome and receipts, and the exit code is the
 * outcome. Background runs hand you a job id instead of a stream.
 */
export function ExecPipeline({ title, description }: DiagramProps) {
	return (
		<DiagramSvg viewBox="0 0 720 400" title={title} description={description}>
			<Panel x={28} y={120} w={180} h={120}>
				<Txt x={44} y={150} className="fill-ink text-body-sm">
					Your script
				</Txt>
				<Txt x={44} y={176} className="fill-ink-muted font-mono text-mono-sm">
					lop exec
				</Txt>
				<Txt x={44} y={194} className="fill-ink-muted font-mono text-mono-sm">
					&quot;check the deploy&quot;
				</Txt>
				<Txt x={44} y={218} className="fill-ink-dim text-meta">
					one task, headless
				</Txt>
			</Panel>
			<Panel x={248} y={120} w={180} h={120}>
				<Txt x={264} y={150} className="fill-ink text-body-sm">
					One session
				</Txt>
				<Txt x={264} y={174} className="fill-ink-muted text-meta">
					runs the turn, then exits
				</Txt>
				<Txt x={264} y={196} className="fill-ink-dim text-meta">
					same runtime, same tools
				</Txt>
			</Panel>
			<Arrow from={[208, 180]} to={[248, 180]} />
			<Arrow from={[428, 180]} to={[468, 180]} />

			<Panel x={468} y={56} w={224} h={280}>
				<Txt x={484} y={86} className="fill-ink text-body-sm">
					What comes back
				</Txt>
				<Txt x={484} y={120} className="fill-ink-muted font-mono text-mono-sm">
					stdout
				</Txt>
				<Txt x={484} y={140} className="fill-ink-dim text-meta">
					final text, or --json events
				</Txt>
				<Txt x={484} y={176} className="fill-ink-muted font-mono text-mono-sm">
					stderr
				</Txt>
				<Txt x={484} y={196} className="fill-ink-dim text-meta">
					receipts and chrome
				</Txt>
				<Txt x={484} y={232} className="fill-ink-muted font-mono text-mono-sm">
					exit code
				</Txt>
				<Txt x={484} y={252} className="fill-ink-dim text-meta">
					0 = the task succeeded
				</Txt>
				<Panel
					x={482}
					y={272}
					w={196}
					h={52}
					className="fill-sunken stroke-hairline"
				>
					<Txt x={492} y={294} className="fill-ink-dim font-mono text-mono-sm">
						{'{ "type": "…",'}
					</Txt>
					<Txt x={492} y={314} className="fill-ink-dim font-mono text-mono-sm">
						{'  "session_id": "…" }'}
					</Txt>
				</Panel>
			</Panel>

			<Chip
				x={28}
				y={352}
				w={210}
				h={40}
				text="--background → a job id, then exit"
			/>
			<Chip
				x={252}
				y={352}
				w={210}
				h={40}
				text="--status <id> → the job record"
			/>
			<Chip
				x={476}
				y={352}
				w={216}
				h={40}
				text="approvals deny without --control"
			/>
		</DiagramSvg>
	);
}
