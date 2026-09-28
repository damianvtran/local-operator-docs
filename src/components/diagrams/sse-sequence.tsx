import { Arrow, type DiagramProps, DiagramSvg, Panel, Txt } from "./primitives";

/**
 * SseSequence — an event-stream subscription across a dropped connection.
 *
 * The three facts the sequence exists to teach: frames carry monotone ids
 * (`id: 42`), a reconnect is resumed with `Last-Event-ID` so nothing needs
 * replaying from zero, and the stream only ends on a terminal frame — a
 * dropped client is a reconnect, not an error.
 */
export function SseSequence({ title, description }: DiagramProps) {
	return (
		<DiagramSvg viewBox="0 0 720 540" title={title} description={description}>
			<Panel x={60} y={36} w={220} h={56}>
				<Txt x={170} y={60} anchor="middle" className="fill-ink text-body-sm">
					Client
				</Txt>
				<Txt x={170} y={78} anchor="middle" className="fill-ink-dim text-meta">
					your app
				</Txt>
			</Panel>
			<Panel x={440} y={36} w={220} h={56}>
				<Txt x={550} y={60} anchor="middle" className="fill-ink text-body-sm">
					Event stream
				</Txt>
				<Txt x={550} y={78} anchor="middle" className="fill-ink-dim text-meta">
					the runtime
				</Txt>
			</Panel>
			<line
				x1={170}
				y1={92}
				x2={170}
				y2={508}
				className="stroke-hairline"
				strokeDasharray="3 4"
			/>
			<line
				x1={550}
				y1={92}
				x2={550}
				y2={508}
				className="stroke-hairline"
				strokeDasharray="3 4"
			/>

			<Arrow from={[170, 128]} to={[550, 128]} />
			<Txt
				x={360}
				y={118}
				anchor="middle"
				className="fill-ink-muted font-mono text-mono-sm"
			>
				{"GET /v1/runs/{id}/events/stream"}
			</Txt>
			<Txt x={360} y={146} anchor="middle" className="fill-ink-dim text-meta">
				Accept: text/event-stream
			</Txt>

			<Arrow from={[550, 188]} to={[170, 188]} />
			<Txt x={360} y={178} anchor="middle" className="fill-ink-muted text-meta">
				200 · : connected · keepalives every 15 s
			</Txt>

			<Arrow from={[550, 248]} to={[170, 248]} />
			<Txt
				x={360}
				y={238}
				anchor="middle"
				className="fill-ink-muted font-mono text-mono-sm"
			>
				{"id: 41 · event: … · data: {…}"}
			</Txt>

			<Arrow from={[550, 308]} to={[170, 308]} />
			<Txt
				x={360}
				y={298}
				anchor="middle"
				className="fill-ink-muted font-mono text-mono-sm"
			>
				{"id: 42 · event: … · data: {…}"}
			</Txt>
			<Txt x={156} y={312} anchor="end" className="fill-ink-dim text-meta">
				keeps the last id seen
			</Txt>

			<line x1={152} y1={360} x2={188} y2={376} className="stroke-ink-dim" />
			<line x1={152} y1={376} x2={188} y2={360} className="stroke-ink-dim" />
			<Txt x={200} y={372} className="fill-ink-dim text-meta">
				the connection drops
			</Txt>

			<Arrow from={[170, 428]} to={[550, 428]} />
			<Txt
				x={360}
				y={418}
				anchor="middle"
				className="fill-ink-muted font-mono text-mono-sm"
			>
				reconnect · Last-Event-ID: 42
			</Txt>
			<Txt x={360} y={446} anchor="middle" className="fill-ink-dim text-meta">
				resumes strictly after 42 — overlap is harmless
			</Txt>

			<Arrow from={[550, 488]} to={[170, 488]} />
			<Txt x={360} y={478} anchor="middle" className="fill-ink-muted text-meta">
				terminal frame — then the stream closes
			</Txt>
		</DiagramSvg>
	);
}
