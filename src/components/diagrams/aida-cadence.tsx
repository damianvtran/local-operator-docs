import { Arrow, type DiagramProps, DiagramSvg, Panel, Txt } from "./primitives";

/**
 * AidaCadence — a day in the life of the always-on conversation.
 *
 * The cadence facts: one check-in a day at 09:00 local (re-armed for the next
 * day by her own runtime), a report that carries only what needs action — a
 * quiet day answers exactly "(no action needed)" — and a bounded allowance
 * of extra check-ins (default 2/day, at least 90 minutes apart). Pause and
 * disable are the two dials.
 */
export function AidaCadence({ title, description }: DiagramProps) {
	return (
		<DiagramSvg viewBox="0 0 720 440" title={title} description={description}>
			<Panel x={30} y={48} w={300} h={148}>
				<Txt x={44} y={76} className="fill-ink text-body-sm">
					Daily check-in — 09:00 local
				</Txt>
				<Txt x={44} y={100} className="fill-ink-muted text-meta">
					one long conversation: /aida
				</Txt>
				<Txt x={44} y={120} className="fill-ink-muted text-meta">
					reviews sessions · projects · wakes
				</Txt>
				<Txt x={44} y={140} className="fill-ink-muted text-meta">
					reports only what needs action
				</Txt>
				<Txt x={44} y={160} className="fill-ink-dim text-meta">
					a quiet day answers (no action needed)
				</Txt>
			</Panel>
			<Panel x={390} y={48} w={300} h={140}>
				<Txt x={404} y={76} className="fill-ink text-body-sm">
					The check-in reports
				</Txt>
				<Txt x={404} y={100} className="fill-ink-muted text-meta">
					only what needs your action
				</Txt>
				<Txt x={404} y={120} className="fill-ink-muted text-meta">
					a quiet day says exactly:
				</Txt>
				<Txt x={404} y={142} className="fill-ink-muted font-mono text-mono-sm">
					(no action needed)
				</Txt>
			</Panel>

			{/* The day timeline. */}
			<line x1={60} y1={280} x2={660} y2={280} className="stroke-hairline" />
			<circle cx={140} cy={280} r={5} className="fill-accent" />
			<circle
				cx={370}
				cy={280}
				r={5}
				className="fill-surface stroke-ink-dim"
				strokeDasharray="3 3"
			/>
			<circle cx={600} cy={280} r={5} className="fill-surface stroke-accent" />
			<Txt x={140} y={302} anchor="middle" className="fill-ink-muted text-meta">
				today · 09:00
			</Txt>
			<Txt x={370} y={302} anchor="middle" className="fill-ink-muted text-meta">
				extra check-in · ≤ 2/day · ≥ 90 min apart
			</Txt>
			<Txt x={600} y={302} anchor="middle" className="fill-ink-muted text-meta">
				next · 09:00
			</Txt>
			<Txt x={600} y={322} anchor="middle" className="fill-ink-dim text-meta">
				re-armed for the next 09:00
			</Txt>

			<Arrow from={[180, 196]} to={[145, 270]} />
			<Arrow from={[540, 188]} to={[595, 270]} />
			<Arrow from={[450, 188]} to={[378, 270]} />
			<Txt x={400} y={224} anchor="end" className="fill-ink-dim text-meta">
				can ask for an extra check-in
			</Txt>

			<Panel
				x={30}
				y={360}
				w={660}
				h={64}
				className="fill-surface stroke-hairline"
			>
				<Txt x={54} y={386} className="fill-ink-muted text-meta">
					/aida pause holds proactive output · /aida resume re-arms it
				</Txt>
				<Txt x={54} y={408} className="fill-ink-dim text-meta">
					disable with aida.enabled=false or LOCAL_OPERATOR_NO_AIDA=1 — zero
					footprint
				</Txt>
			</Panel>
		</DiagramSvg>
	);
}
