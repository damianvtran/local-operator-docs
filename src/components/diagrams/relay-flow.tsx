import {
	Arrow,
	type DiagramProps,
	DiagramSvg,
	Panel,
	RADIUS,
	Txt,
} from "./primitives";

/**
 * RelayFlow — how the phone reaches a machine running sessions.
 *
 * The shipped facts: the `lop mobile` daemon binds loopback only (it must
 * never take a public address), and the remote path is something the user
 * puts in front — Cloudflare Tunnel + Access is the recommended one, with
 * Tailscale an alternative. The phone leg rides HTTP + SSE because identity
 * proxies break WebSocket handshakes.
 */
export function RelayFlow({ title, description }: DiagramProps) {
	return (
		<DiagramSvg viewBox="0 0 720 380" title={title} description={description}>
			<Panel x={30} y={88} w={170} h={84}>
				<Txt x={44} y={122} className="fill-ink text-body-sm">
					Phone
				</Txt>
				<Txt x={44} y={144} className="fill-ink-muted text-meta">
					watch · steer · start
				</Txt>
			</Panel>

			<Panel x={250} y={88} w={180} h={84}>
				<Txt x={264} y={118} className="fill-ink text-body-sm">
					Secure path in front
				</Txt>
				<Txt x={264} y={140} className="fill-ink-muted text-meta">
					Cloudflare Tunnel + Access
				</Txt>
				<Txt x={264} y={158} className="fill-ink-muted text-meta">
					or Tailscale
				</Txt>
			</Panel>

			<Arrow from={[200, 130]} to={[250, 130]} />
			<Arrow from={[430, 130]} to={[498, 130]} />
			<Txt x={225} y={118} anchor="middle" className="fill-ink-dim text-meta">
				https
			</Txt>
			<Txt x={464} y={118} anchor="middle" className="fill-ink-dim text-meta">
				loopback
			</Txt>

			<Panel x={480} y={40} w={210} h={270} rx={RADIUS.md}>
				<Txt x={494} y={68} className="fill-ink text-body-sm">
					Your machine
				</Txt>
				<Panel x={498} y={88} w={174} h={76}>
					<Txt x={512} y={116} className="fill-ink text-body-sm">
						session daemon
					</Txt>
					<Txt
						x={512}
						y={136}
						className="fill-ink-muted font-mono text-mono-sm"
					>
						127.0.0.1:4098
					</Txt>
					<Txt x={512} y={154} className="fill-ink-dim text-meta">
						loopback only
					</Txt>
				</Panel>
				<Panel x={498} y={200} w={174} h={76}>
					<Txt x={512} y={228} className="fill-ink text-body-sm">
						your sessions
					</Txt>
					<Txt x={512} y={248} className="fill-ink-muted text-meta">
						TUI · desktop · exec
					</Txt>
					<Txt x={512} y={266} className="fill-ink-dim text-meta">
						seen by the daemon
					</Txt>
				</Panel>
				<Arrow from={[585, 164]} to={[585, 200]} heads="both" />
				<Txt x={598} y={186} className="fill-ink-dim text-meta">
					control socket
				</Txt>
			</Panel>

			<Panel
				x={30}
				y={326}
				w={330}
				h={36}
				className="fill-surface stroke-hairline"
			>
				<Txt
					x={195}
					y={348}
					anchor="middle"
					className="fill-ink-muted text-meta"
				>
					phone leg is HTTP + SSE — live transcripts, no WebSocket
				</Txt>
			</Panel>
			<Panel
				x={376}
				y={326}
				w={314}
				h={36}
				className="fill-surface stroke-hairline"
			>
				<Txt
					x={533}
					y={348}
					anchor="middle"
					className="fill-ink-muted text-meta"
				>
					phone-started approvals are answered on the phone
				</Txt>
			</Panel>
		</DiagramSvg>
	);
}
