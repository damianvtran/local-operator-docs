import { Arrow, type DiagramProps, DiagramSvg, Panel, Txt } from "./primitives";

/**
 * SupplyFlow — declare an agent or team, share it through the hub, run it from
 * any surface.
 *
 * The three columns are the three moments of the supply story, and the bottom
 * band names the instruction layers a member actually sees: the profile's base
 * (`system_prompt.md`), then the team's collaboration and project briefs. The
 * mono lines are commands the CLI really takes (see the build pages).
 */
export function SupplyFlow({ title, description }: DiagramProps) {
	const stages = [
		{
			x: 28,
			title: "Declare",
			lines: [
				"write the files once",
				"agents/<id>/agent.yml",
				"teams/<id>/team.yml",
			],
		},
		{
			x: 264,
			title: "Share — Agent Hub",
			lines: [
				"publish, pull, sync",
				"lop agents push --org <t>",
				"lop agents sync",
			],
		},
		{
			x: 500,
			title: "Run",
			lines: [
				"attach by name",
				"lop exec --team release",
				"SessionSpec(team=…)",
			],
		},
	];
	return (
		<DiagramSvg viewBox="0 0 720 400" title={title} description={description}>
			<Txt x={123} y={104} anchor="middle" className="fill-ink-dim text-meta">
				author once
			</Txt>
			<Txt x={359} y={104} anchor="middle" className="fill-ink-dim text-meta">
				teammates pull, sync
			</Txt>
			<Txt x={595} y={104} anchor="middle" className="fill-ink-dim text-meta">
				every surface
			</Txt>
			<Arrow from={[218, 190]} to={[264, 190]} />
			<Arrow from={[454, 190]} to={[500, 190]} />

			{stages.map((stage) => (
				<Panel key={stage.title} x={stage.x} y={120} w={190} h={140}>
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
									: "fill-ink-muted font-mono text-mono-sm"
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
				w={664}
				h={44}
				className="fill-surface stroke-hairline"
			>
				<Txt
					x={360}
					y={322}
					anchor="middle"
					className="fill-ink-muted text-meta"
				>
					one base per agent, layered per team: system_prompt.md →
					instructions.md → project.md
				</Txt>
			</Panel>
		</DiagramSvg>
	);
}
