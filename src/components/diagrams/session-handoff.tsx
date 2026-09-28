import {
	Arrow,
	Badge,
	type DiagramProps,
	DiagramSvg,
	Panel,
	Txt,
} from "./primitives";

/**
 * SessionHandoff — moving a conversation between two paired devices.
 *
 * The mobility semantics that matter to a reader: the device that will HOLD
 * the conversation issues the move (there is no push verb), the default is a
 * move — the source copy retires once the handoff commits — and a busy
 * session is refused rather than interrupted. `--keep` forks instead, and
 * `--from-replica` recovers the last synced copy as a new session.
 */
export function SessionHandoff({ title, description }: DiagramProps) {
	return (
		<DiagramSvg viewBox="0 0 720 400" title={title} description={description}>
			<Panel x={30} y={36} w={280} h={104}>
				<Txt x={44} y={70} className="fill-ink text-body-sm">
					Laptop
				</Txt>
				<Txt x={44} y={94} className="fill-ink-muted font-mono text-mono-sm">
					session 7fa2 — running
				</Txt>
				<Txt x={44} y={116} className="fill-ink-dim text-meta">
					the owner is the device it runs on
				</Txt>
			</Panel>
			<Panel x={410} y={36} w={280} h={104}>
				<Txt x={424} y={70} className="fill-ink text-body-sm">
					Desktop
				</Txt>
				<Txt x={424} y={94} className="fill-ink-muted font-mono text-mono-sm">
					lop sessions move 7fa2 --to local
				</Txt>
				<Txt x={424} y={116} className="fill-ink-dim text-meta">
					the receiving device issues the move
				</Txt>
			</Panel>
			<Arrow from={[310, 88]} to={[410, 88]} className="text-accent" />
			<Txt x={360} y={78} anchor="middle" className="fill-ink-muted text-meta">
				transcript + id
			</Txt>

			<Panel x={30} y={170} w={212} h={124}>
				<Badge x={52} y={196} n={1} />
				<Txt x={74} y={200} className="fill-ink text-body-sm">
					Issue the move
				</Txt>
				<Txt x={44} y={226} className="fill-ink-muted text-meta">
					the device that will hold it
				</Txt>
				<Txt x={44} y={248} className="fill-ink-muted font-mono text-mono-sm">
					lop sessions move --to local
				</Txt>
			</Panel>
			<Panel x={258} y={170} w={212} h={124}>
				<Badge x={280} y={196} n={2} />
				<Txt x={302} y={200} className="fill-ink text-body-sm">
					Commit the handoff
				</Txt>
				<Txt x={272} y={226} className="fill-ink-muted text-meta">
					transcript and id travel;
				</Txt>
				<Txt x={272} y={246} className="fill-ink-muted text-meta">
					the copy here retires at commit
				</Txt>
			</Panel>
			<Panel x={486} y={170} w={212} h={124}>
				<Badge x={508} y={196} n={3} />
				<Txt x={530} y={200} className="fill-ink text-body-sm">
					Continue there
				</Txt>
				<Txt x={500} y={226} className="fill-ink-muted text-meta">
					same session, same id,
				</Txt>
				<Txt x={500} y={246} className="fill-ink-muted text-meta">
					on the new device
				</Txt>
			</Panel>

			<Panel
				x={30}
				y={316}
				w={330}
				h={36}
				className="fill-surface stroke-hairline"
			>
				<Txt
					x={195}
					y={338}
					anchor="middle"
					className="fill-ink-muted text-meta"
				>
					busy sessions are refused, not interrupted
				</Txt>
			</Panel>
			<Panel
				x={376}
				y={316}
				w={322}
				h={36}
				className="fill-surface stroke-hairline"
			>
				<Txt
					x={537}
					y={338}
					anchor="middle"
					className="fill-ink-muted text-meta"
				>
					--keep forks · --from-replica recovers a synced copy
				</Txt>
			</Panel>
		</DiagramSvg>
	);
}
