import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { track } from "./lib/track";
import Background from "./components/Background";
import Landing from "./components/Landing";
import GamePlay, { type ListingResult } from "./components/GamePlay";
import Results from "./components/Results";
import { dailyListings, randomListings, todayKey } from "./lib/game";
import type { Listing } from "./data/listings";

type Screen = "landing" | "play" | "results";
type Mode = "daily" | "endless";

const ENDLESS_BATCH = 2;

function loadStreak(): { streak: number; last: string } {
  try {
    const raw = localStorage.getItem("ballpark:streak");
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return { streak: 0, last: "" };
}

function bumpStreak(): number {
  const today = todayKey();
  const s = loadStreak();
  if (s.last === today) return s.streak; // already counted today
  const y = new Date(); y.setDate(y.getDate() - 1);
  const streak = s.last === todayKey(y) ? s.streak + 1 : 1;
  localStorage.setItem("ballpark:streak", JSON.stringify({ streak, last: today }));
  return streak;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [mode, setMode] = useState<Mode>("daily");
  const [listings, setListings] = useState<Listing[]>([]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<ListingResult[]>([]);
  const [streak, setStreak] = useState(loadStreak().streak);
  const [seen, setSeen] = useState<number[]>([]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [screen, idx]);

  const startDaily = () => {
    setMode("daily");
    setListings(dailyListings());
    setIdx(0); setResults([]); setScreen("play");
    track("play_start", { mode: "daily" });
  };
  const startEndless = () => {
    const batch = randomListings(ENDLESS_BATCH, seen);
    setMode("endless");
    setListings(batch);
    setSeen((s) => [...s, ...batch.map((l) => l.id)]);
    setIdx(0); setResults([]); setScreen("play");
    track("endless_start");
  };

  const onComplete = (r: ListingResult) => {
    const all = [...results, r];
    setResults(all);
    track("home_complete", { mode, won: r.won, guesses: r.guesses });
    if (idx + 1 < listings.length) {
      setIdx(idx + 1);
    } else {
      if (mode === "daily") setStreak(bumpStreak());
      setScreen("results");
      track("round_complete", { mode, points: all.reduce((s, x) => s + x.points, 0) });
    }
  };

  const replay = () => {
    if (mode === "daily") startEndless();
    else startEndless();
  };

  const goHome = () => { setScreen("landing"); setIdx(0); setResults([]); };

  return (
    <>
      {screen !== "landing" && <Background />}
      <div className="bar">
        <button className="brand" onClick={goHome}><span className="orb" /> Ballpark</button>
        <div className="nav">
          <button className={screen === "landing" ? "active" : ""} onClick={goHome}>Home</button>
          <button className={screen === "play" && mode === "daily" ? "active" : ""} onClick={startDaily}>Daily</button>
          <button className={mode === "endless" && screen === "play" ? "active" : ""} onClick={startEndless}>Endless</button>
        </div>
        <span className="spacer" />
        <span className="badge">🔥 {streak}</span>
      </div>

      <div className="stage">
        {screen === "landing" && <Landing onPlay={startDaily} onEndless={startEndless} />}
        {screen === "play" && listings[idx] && (
          <GamePlay
            key={mode + ":" + listings[idx].id + ":" + idx}
            listing={listings[idx]}
            index={idx}
            total={listings.length}
            onComplete={onComplete}
          />
        )}
        {screen === "results" && (
          <Results results={results} mode={mode} streak={streak} onReplay={replay} onHome={goHome} />
        )}
      </div>

      <Analytics />
      <p className="note">
        {mode === "endless" || screen !== "landing"
          ? "Real MLS listings · prices hidden until you guess · a feedback build"
          : "Guess real home prices · new homes every day"}
      </p>
    </>
  );
}
