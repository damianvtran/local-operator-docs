import { Arrow, type DiagramProps, DiagramSvg, Panel, Txt } from "./primitives";

/**
 * HubPublishFlow — pushing an agent through moderation to the registry, and
 * pulling one back down.
 *
 * Pulling is the no-key half (`lop agents pull --id`); pushing is the
 * account half (`lop credential update <KEY_NAME>` then `lop agents push`),
 * and the refusals a pusher sees are named — `name_taken`,
 * `moderation_rejected`. Org sharing reuses the same pipeline with a
 * different visibility.
 */
export function HubPublishFlow({ title, description }: DiagramProps) {
	const stages = [
		{
			x: 28,
			title: "Your machine",
			lines: ["a taught agent", "lop agents push", '--name "My Agent"'],
		},
		{
			x: 198,
			title: "Moderation",
			lines: [
				"name + content checks",
				"refusals come back named:",
				"name_taken",
			],
		},
		{
			x: 368,
			title: "Agent Hub",
			lines: ["the public registry", "api.radienthq.com", "community shelf"],
		},
		{
			x: 538,
			title: "Another machine",
			lines: ["pull, no key needed", "lop agents pull", '--id "<agent id>"'],
		},
	];
	return (
		<DiagramSvg viewBox="0 0 720 400" title={title} description={description}>
			<Txt x={188} y={104} anchor="middle" className="fill-ink-dim text-meta">
				push · signed in
			</Txt>
			<Txt x={358} y={104} anchor="middle" className="fill-ink-dim text-meta">
				moderated
			</Txt>
			<Txt x={528} y={104} anchor="middle" className="fill-ink-dim text-meta">
				pull · no key
			</Txt>
			<Arrow from={[178, 190]} to={[198, 190]} />
			<Arrow from={[348, 190]} to={[368, 190]} />
			<Arrow from={[518, 190]} to={[538, 190]} />

			{stages.map((stage) => (
				<Panel key={stage.title} x={stage.x} y={120} w={150} h={140}>
					<Txt x={stage.x + 14} y={148} className="fill-ink text-body-sm">
						{stage.title}
					</Txt>
					{stage.lines.map((line, index) => (
						<Txt
							// Rows are fixed slots; index is the slot number, not identity.
							key={line}
							x={stage.x + 14}
							y={172 + index * 22}
							className={
								index === 0
									? "fill-ink-muted text-meta"
									: index === 1
										? "fill-ink-muted font-mono text-mono-sm"
										: "fill-ink-dim font-mono text-mono-sm"
							}
						>
							{line}
						</Txt>
					))}
				</Panel>
			))}

			<Panel
				x={28}
				y={296}
				w={330}
				h={44}
				className="fill-surface stroke-hairline"
			>
				<Txt
					x={193}
					y={322}
					anchor="middle"
					className="fill-ink-muted text-meta"
				>
					org sharing: --org &lt;tenant&gt; publishes to your team
				</Txt>
			</Panel>
			<Panel
				x={374}
				y={296}
				w={318}
				h={44}
				className="fill-surface stroke-hairline"
			>
				<Txt
					x={533}
					y={322}
					anchor="middle"
					className="fill-ink-muted text-meta"
				>
					browse and pull from the desktop Agent hub page
				</Txt>
			</Panel>
		</DiagramSvg>
	);
}
