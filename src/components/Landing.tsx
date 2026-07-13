import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import HouseScene from "../three/HouseScene";
import LandingBackground from "../three/LandingBackground";

export default function Landing({ onPlay, onEndless }: { onPlay: () => void; onEndless: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const q = root.current!.querySelectorAll(".rise");
    gsap.to(q, { y: 0, opacity: 1, duration: 0.7, stagger: 0.09, ease: "power3.out" });
  }, []);
  return (
    <div ref={root}>
      <LandingBackground />
      <div className="hero">
        <div className="eyebrow rise">The daily home price game</div>
        <div className="scene rise">
          <div className="halo" />
          <HouseScene height={230} />
        </div>
        <h1 className="rise">Guess what <span className="holotext">this home</span> is worth.</h1>
        <p className="rise">A real listing. No price shown. Read the clues, trust your gut, and see how close you land.</p>
      </div>

      <div className="steps">
        <div className="step glass rise"><div className="k">1</div><div><h3>Study the home</h3><p>Photos, beds, baths, size, year, location — everything but the price.</p></div></div>
        <div className="step glass rise"><div className="k">2</div><div><h3>Guess the price</h3><p>Slide, tap, or type. Every miss unlocks a clue that pulls you closer.</p></div></div>
        <div className="step glass rise"><div className="k">3</div><div><h3>Top the board</h3><p>Fewer clues = higher score. Climb the ranks, share your streak.</p></div></div>
      </div>

      <button className="cta rise" onClick={onPlay}>Play today's 2 homes →</button>
      <button className="otherbtn rise" onClick={onEndless} style={{ marginTop: 10 }}>Endless mode — keep playing</button>
      <p className="foot rise">2 homes daily · new set every morning · free</p>
    </div>
  );
}
