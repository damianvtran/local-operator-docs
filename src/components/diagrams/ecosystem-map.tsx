import {
	Chip,
	type DiagramProps,
	DiagramSvg,
	Panel,
	RADIUS,
	Txt,
} from "./primitives";

/**
 * EcosystemMap — what surrounds the runtime.
 *
 * Four groups, matching the ecosystem page's inventory: the extension points
 * (skills, MCP, teams, subagents), the models it can point at (sign-ins, API
 * keys, local servers), the sharing surfaces (the Agent Hub and org
 * sharing), and the places it reaches from.
 */
export function EcosystemMap({ title, description }: DiagramProps) {
	const groups = [
		{
			x: 24,
			y: 36,
			title: "Extend it",
			chips: [
				{ x: 40, y: 76, w: 138, text: "Skills — SKILL.md" },
				{ x: 188, y: 76, w: 140, text: "MCP servers" },
				{ x: 40, y: 112, w: 138, text: "Teams & roles" },
				{ x: 188, y: 112, w: 140, text: "Agents & subagents" },
			],
		},
		{
			x: 376,
			y: 36,
			title: "Point it at any model",
			chips: [
				{ x: 392, y: 76, w: 138, text: "Subscription logins" },
				{ x: 540, y: 76, w: 140, text: "API keys" },
				{
					x: 392,
					y: 112,
					w: 288,
					text: "Ollama · vLLM · LM Studio",
				},
			],
		},
		{
			x: 24,
			y: 336,
			title: "Share it",
			chips: [
				{ x: 40, y: 376, w: 288, text: "Agent Hub — pull, no key needed" },
				{ x: 40, y: 412, w: 288, text: "push your own (Radient account)" },
			],
		},
		{
			x: 376,
			y: 336,
			title: "Reach it anywhere",
			chips: [
				{ x: 392, y: 376, w: 288, text: "TUI · desktop · mobile · extension" },
				{ x: 392, y: 412, w: 288, text: "exec · SSE · the Python SDK" },
			],
		},
	];
	return (
		<DiagramSvg viewBox="0 0 720 520" title={title} description={description}>
			{/* Quadrant connectors, drawn first so panels sit on top. */}
			<line x1={270} y1={210} x2={200} y2={184} className="stroke-hairline" />
			<line x1={450} y1={210} x2={520} y2={184} className="stroke-hairline" />
			<line x1={270} y1={310} x2={200} y2={336} className="stroke-hairline" />
			<line x1={450} y1={310} x2={520} y2={336} className="stroke-hairline" />

			{groups.map((group) => (
				<g key={group.title}>
					<Panel x={group.x} y={group.y} w={320} h={148}>
						<Txt
							x={group.x + 16}
							y={group.y + 28}
							className="fill-ink text-body-sm"
						>
							{group.title}
						</Txt>
					</Panel>
					{group.chips.map((chip) => (
						<Chip
							key={chip.text}
							x={chip.x}
							y={chip.y}
							w={chip.w}
							text={chip.text}
						/>
					))}
				</g>
			))}

			<Panel
				x={270}
				y={210}
				w={180}
				h={100}
				rx={RADIUS.md}
				className="fill-accent-wash stroke-accent"
			>
				<Txt x={360} y={248} anchor="middle" className="fill-ink text-body-sm">
					Local Operator
				</Txt>
				<Txt
					x={360}
					y={272}
					anchor="middle"
					className="fill-ink-muted text-meta"
				>
					runs on your machine
				</Txt>
			</Panel>

			<Txt x={360} y={504} anchor="middle" className="fill-ink-dim text-meta">
				GitHub · local-operator.com · community agents
			</Txt>
		</DiagramSvg>
	);
}
