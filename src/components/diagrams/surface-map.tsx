import {
	Arrow,
	type DiagramProps,
	DiagramSvg,
	Panel,
	RADIUS,
	Txt,
} from "./primitives";

/**
 * SurfaceMap — one runtime, every surface.
 *
 * The six ways in that `choose your surface` lists, drawn against what they
 * all share: the same sessions and the same configuration. Connectors are
 * bidirectional because a surface both drives the runtime and receives from
 * it (a viewer shows what the runtime is doing).
 */
export function SurfaceMap({ title, description }: DiagramProps) {
	const satellites = [
		{ x: 20, y: 56, title: "Terminal (TUI)", sub: "keyboard-first control" },
		{ x: 20, y: 168, title: "Desktop app", sub: "chat, canvas, schedules" },
		{ x: 20, y: 280, title: "Mobile relay", sub: "watch · steer · start" },
		{
			x: 510,
			y: 56,
			title: "Browser extension",
			sub: "the agent, in your browser",
		},
		{ x: 510, y: 168, title: "Exec mode", sub: "one task, headless" },
		{ x: 510, y: 280, title: "Python SDK", sub: "embed the runtime" },
	];
	return (
		<DiagramSvg viewBox="0 0 720 400" title={title} description={description}>
			{/* Connectors first so the cards draw over their ends. */}
			<Arrow
				from={[210, 88]}
				to={[270, 200]}
				heads="both"
				className="text-ink-dim"
			/>
			<Arrow
				from={[210, 200]}
				to={[270, 200]}
				heads="both"
				className="text-ink-dim"
			/>
			<Arrow
				from={[210, 312]}
				to={[270, 200]}
				heads="both"
				className="text-ink-dim"
			/>
			<Arrow
				from={[510, 88]}
				to={[450, 200]}
				heads="both"
				className="text-ink-dim"
			/>
			<Arrow
				from={[510, 200]}
				to={[450, 200]}
				heads="both"
				className="text-ink-dim"
			/>
			<Arrow
				from={[510, 312]}
				to={[450, 200]}
				heads="both"
				className="text-ink-dim"
			/>

			<Panel
				x={270}
				y={140}
				w={180}
				h={120}
				rx={RADIUS.md}
				className="fill-accent-wash stroke-accent"
			>
				<Txt x={360} y={184} anchor="middle" className="fill-ink text-body-sm">
					One runtime
				</Txt>
				<Txt
					x={360}
					y={208}
					anchor="middle"
					className="fill-ink-muted text-meta"
				>
					same sessions
				</Txt>
				<Txt
					x={360}
					y={226}
					anchor="middle"
					className="fill-ink-muted text-meta"
				>
					same configuration
				</Txt>
			</Panel>

			{satellites.map((s) => (
				<Panel key={s.title} x={s.x} y={s.y} w={190} h={64}>
					<Txt x={s.x + 14} y={s.y + 28} className="fill-ink text-body-sm">
						{s.title}
					</Txt>
					<Txt x={s.x + 14} y={s.y + 48} className="fill-ink-muted text-meta">
						{s.sub}
					</Txt>
				</Panel>
			))}
		</DiagramSvg>
	);
}
