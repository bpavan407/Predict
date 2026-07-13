import * as Dialog from "@radix-ui/react-dialog";
import type { LbRow } from "../lib/game";

export default function LeaderboardModal({
  open, onOpenChange, rows, rank, points,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rows: LbRow[];
  rank: number;
  points: number;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="modal glass" aria-describedby={undefined}>
          <div className="modal-h">
            <Dialog.Title asChild><h2>Daily <span>Leaderboard</span></h2></Dialog.Title>
            <p>Today's top players</p>
            <Dialog.Close className="x" aria-label="Close">✕</Dialog.Close>
          </div>
          <div className="lb">
            {rows.map((r, i) => {
              const prev = rows[i - 1];
              const gap = prev && r.rank - prev.rank > 1;
              return (
                <div key={r.rank + r.name}>
                  {gap && <div className="gap">· · ·</div>}
                  <div className={"row" + (r.you ? " you" : "")}>
                    <span className="rk">{r.rank}</span>
                    <span className="nm">{r.you ? <>You <small>(Guest)</small></> : r.name}</span>
                    <span className="pt mono">{r.points.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="lb-cta">
            <b>#{rank}</b>
            <p>Your {points.toLocaleString()} pts would place you {rank}{ord(rank)} — don't let it go unclaimed.</p>
            <button>Sign in to claim your spot</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ord(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
