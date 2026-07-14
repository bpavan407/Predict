import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { ListingResult } from "./GamePlay";
import { simulatedLeaderboard } from "../lib/game";
import { track } from "../lib/track";
import LeaderboardModal from "./LeaderboardModal";

function bar(pct: number): string {
  const filled = pct <= 1 ? 5 : pct <= 2 ? 4 : pct <= 5 ? 3 : pct <= 10 ? 2 : pct <= 20 ? 1 : 0;
  return "🟩".repeat(filled) + "⬜".repeat(5 - filled);
}

export default function Results({
  results, mode, streak, onReplay, onHome,
}: {
  results: ListingResult[];
  mode: "daily" | "endless";
  streak: number;
  onReplay: () => void;
  onHome: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [lbOpen, setLbOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const points = results.reduce((s, r) => s + r.points, 0);
  const { rows, rank, total } = simulatedLeaderboard(points);

  useEffect(() => {
    const q = root.current!.querySelectorAll(".rise");
    gsap.to(q, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" });
  }, []);

  const shareText =
    `◆ Ballpark — ${mode === "daily" ? "Daily #" + dayNo() : "Endless"}\n` +
    results.map((r, i) => {
      const price = `Home ${i + 1}  ${bar(r.bestPct)}  ${r.bestPct.toFixed(1)}% off`;
      const size = r.bonusPlayed && r.bonusPct != null ? `\n   📐 size  ${bar(r.bonusPct)}  ${r.bonusPct.toFixed(1)}% off` : "";
      return price + size;
    }).join("\n") +
    `\n🔥 ${streak} day streak · ${points.toLocaleString()} pts · ranked #${rank}\n` +
    `ballpark.game`;

  const share = async () => {
    track("share_click", { mode, points, rank });
    try {
      if (navigator.share) await navigator.share({ text: shareText });
      else { await navigator.clipboard.writeText(shareText); flash(); }
    } catch {
      try { await navigator.clipboard.writeText(shareText); flash(); } catch { /* noop */ }
    }
  };
  const flash = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };

  return (
    <div ref={root}>
      <div className="streak glass rise">
        <div className="fire">🔥</div>
        <div className="num">{streak}</div>
        <div className="lab">Day Streak</div>
        <div className="sub">{streak <= 1 ? "Streak started — come back tomorrow" : "Keep it alive tomorrow!"}</div>
      </div>

      <div className="rankrow glass rise">
        <div className="r mono">#{rank} <small>/ {total}</small></div>
        <div className="grow" />
        <button className="mini gold">Sign in to save</button>
        <button className="mini" onClick={() => setLbOpen(true)}>Leaderboard</button>
      </div>

      <button className="share rise" onClick={share}>
        Share results
        {copied && <span className="copied">Copied ✓</span>}
      </button>

      <button className="otherbtn rise" onClick={onReplay}>
        {mode === "daily" ? "Play endless mode" : "Play more homes"}
      </button>
      <p className="comeback glass rise">
        {mode === "daily" ? "Come back tomorrow for a new daily challenge" : `You scored ${points.toLocaleString()} points`}
      </p>

      <div className="sharecard glass rise">{shareText}</div>

      <button className="otherbtn rise" onClick={onHome} style={{ marginTop: 12 }}>Back to home</button>

      <LeaderboardModal open={lbOpen} onOpenChange={setLbOpen} rows={rows} rank={rank} points={points} />
    </div>
  );
}

function dayNo() {
  const start = new Date(2026, 0, 1).getTime();
  return Math.floor((Date.now() - start) / 86400000);
}
