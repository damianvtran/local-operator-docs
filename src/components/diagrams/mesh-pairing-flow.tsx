import {
	Arrow,
	Badge,
	type DiagramProps,
	DiagramSvg,
	Panel,
	Txt,
} from "./primitives";

/**
 * MeshPairingFlow — the pairing ceremony, in the order the two keyboards
 * actually see it.
 *
 * The load-bearing details: the invite token is single-use and travels out
 * of band (a file a person moves); the joiner derives its own 6-digit code
 * and both screens show it for a human to compare; and no agent path can
 * complete the ceremony — the join step parks and hands the person their
 * turn.
 */
export function MeshPairingFlow({ title, description }: DiagramProps) {
	return (
		<DiagramSvg viewBox="0 0 720 460" title={title} description={description}>
			{/* The step rail. */}
			<line
				x1={52}
				y1={62}
				x2={52}
				y2={392}
				className="stroke-hairline"
				strokeDasharray="3 4"
			/>
			<Badge x={52} y={76} n={1} />
			<Badge x={52} y={158} n={2} />
			<Badge x={52} y={240} n={3} />
			<Badge x={52} y={322} n={4} />

			<Txt x={84} y={80} className="fill-ink text-body-sm">
				Device A mints the invite
			</Txt>
			<Txt x={84} y={102} className="fill-ink-muted font-mono text-mono-sm">
				lop network invite
			</Txt>
			<Txt x={84} y={120} className="fill-ink-dim text-meta">
				a single-use token file (0600) — default TTL 10 min
			</Txt>

			<Txt x={84} y={162} className="fill-ink text-body-sm">
				A person carries it across
			</Txt>
			<Txt x={84} y={184} className="fill-ink-dim text-meta">
				out of band — moved by hand, never through a chat
			</Txt>

			<Txt x={84} y={244} className="fill-ink text-body-sm">
				Device B derives its own code
			</Txt>
			<Txt x={84} y={266} className="fill-ink-muted font-mono text-mono-sm">
				lop network join @&lt;token&gt;
			</Txt>
			<Txt x={84} y={284} className="fill-ink-dim text-meta">
				both screens now show the same 6-digit code + fingerprint
			</Txt>

			<Txt x={84} y={326} className="fill-ink text-body-sm">
				A human compares and confirms
			</Txt>
			<Txt x={84} y={348} className="fill-ink-dim text-meta">
				the joiner types the code read off the other device&apos;s screen
			</Txt>
			<Txt x={84} y={366} className="fill-ink-dim text-meta">
				agents can park the ceremony — never complete a pairing
			</Txt>

			{/* The artifacts the ceremony moves between the two devices. */}
			<Panel x={530} y={48} w={150} h={64}>
				<Txt x={605} y={76} anchor="middle" className="fill-ink text-body-sm">
					invite token
				</Txt>
				<Txt x={605} y={96} anchor="middle" className="fill-ink-dim text-meta">
					single-use · TTL&apos;d
				</Txt>
			</Panel>
			<Arrow
				from={[605, 116]}
				to={[605, 192]}
				dashed
				className="text-ink-dim"
			/>
			<Txt x={592} y={148} anchor="end" className="fill-ink-dim text-meta">
				carried by hand
			</Txt>
			<Panel
				x={520}
				y={196}
				w={170}
				h={84}
				className="fill-elevated stroke-accent"
			>
				<Txt
					x={605}
					y={234}
					anchor="middle"
					className="fill-accent font-mono text-title"
				>
					481 926
				</Txt>
				<Txt x={605} y={260} anchor="middle" className="fill-ink-dim text-meta">
					fingerprint alongside
				</Txt>
			</Panel>

			<Panel
				x={30}
				y={408}
				w={660}
				h={40}
				className="fill-accent-wash stroke-accent"
			>
				<Txt x={360} y={433} anchor="middle" className="fill-ink text-meta">
					Paired — every link after this is device-to-device; no service in the
					middle.
				</Txt>
			</Panel>
		</DiagramSvg>
	);
}
