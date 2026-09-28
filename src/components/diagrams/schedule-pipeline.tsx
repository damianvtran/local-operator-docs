import {
	Arrow,
	Chip,
	type DiagramProps,
	DiagramSvg,
	Panel,
	Txt,
} from "./primitives";

/**
 * SchedulePipeline — what happens between "schedule this" and the turn
 * running.
 *
 * The branch is the point of the picture: a live runtime fires the wake from
 * the session's own scheduler, while a machine with nothing running gets a
 * runtime started by the wake supervisor (installed on demand) and fires on
 * load. Missed occurrences are skipped, not replayed.
 */
export function SchedulePipeline({ title, description }: DiagramProps) {
	return (
		<DiagramSvg viewBox="0 0 720 560" title={title} description={description}>
			<Panel x={210} y={36} w={300} h={76}>
				<Txt x={226} y={64} className="fill-ink text-body-sm">
					Schedule a wake
				</Txt>
				<Txt x={226} y={88} className="fill-ink-muted font-mono text-mono-sm">
					lop wake create &lt;session&gt; &quot;in 30m&quot; &quot;…&quot;
				</Txt>
			</Panel>
			<Arrow from={[360, 112]} to={[360, 152]} />
			<Panel x={210} y={152} w={300} h={72}>
				<Txt x={226} y={180} className="fill-ink text-body-sm">
					The due time arrives
				</Txt>
				<Txt x={226} y={202} className="fill-ink-dim text-meta">
					stored with the session — survives restarts
				</Txt>
			</Panel>

			{/* The T-split: who fires it depends on whether anything is running. */}
			<line x1={360} y1={224} x2={360} y2={248} className="stroke-hairline" />
			<line x1={196} y1={248} x2={524} y2={248} className="stroke-hairline" />
			<Arrow from={[196, 248]} to={[196, 272]} />
			<Arrow from={[524, 248]} to={[524, 272]} />

			<Panel x={36} y={272} w={320} h={104}>
				<Txt x={52} y={300} className="fill-ink text-body-sm">
					Runtime is live
				</Txt>
				<Txt x={52} y={322} className="fill-ink-muted text-meta">
					the session&apos;s own scheduler fires it
				</Txt>
				<Txt x={52} y={342} className="fill-ink-dim text-meta">
					no supervisor needed
				</Txt>
			</Panel>
			<Panel x={364} y={272} w={320} h={104}>
				<Txt x={380} y={300} className="fill-ink text-body-sm">
					Nothing is running
				</Txt>
				<Txt x={380} y={322} className="fill-ink-muted text-meta">
					the wake supervisor starts a runtime
				</Txt>
				<Txt x={380} y={342} className="fill-ink-dim text-meta">
					the session then fires on load
				</Txt>
			</Panel>

			<Arrow from={[196, 376]} to={[300, 400]} />
			<Arrow from={[524, 376]} to={[420, 400]} />
			<Panel
				x={210}
				y={400}
				w={300}
				h={64}
				className="fill-accent-wash stroke-accent"
			>
				<Txt x={360} y={431} anchor="middle" className="fill-ink text-body-sm">
					A turn runs — as if a message arrived
				</Txt>
			</Panel>

			<Chip
				x={36}
				y={496}
				w={320}
				h={44}
				text="missed while the machine was off? skipped, not replayed"
			/>
			<Chip
				x={364}
				y={496}
				w={320}
				h={44}
				text="60 s minimum recurrence · 16 schedules per session"
			/>
		</DiagramSvg>
	);
}
