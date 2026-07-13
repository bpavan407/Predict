import { useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import type { Listing } from "../data/listings";
import {
  decodePrice, money, pctOff, scoreGuess, accuracyLabel,
  momentumClue, buildClues, MAX_GUESSES, WIN_PCT,
  scoreSize, sizeVerdict,
} from "../lib/game";
import PhotoCarousel from "./PhotoCarousel";
import GuessInput, { SIZE_CFG } from "./GuessInput";
import { track, pctBucket } from "../lib/track";

export interface ListingResult {
  listingId: number;
  bestPct: number;
  guesses: number;
  points: number;
  won: boolean;
  bonusPlayed: boolean;
  bonusPct?: number;
}

interface Guess { value: number; pct: number; high: boolean; win: boolean }

export default function GamePlay({
  listing, index, total, onComplete,
}: {
  listing: Listing;
  index: number;
  total: number;
  onComplete: (r: ListingResult) => void;
}) {
  const actual = useMemo(() => decodePrice(listing.p), [listing]);
  const clues = useMemo(() => buildClues(listing), [listing]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [bonusPhase, setBonusPhase] = useState<"offer" | "guessing" | "done">("offer");
  const [sizeGuess, setSizeGuess] = useState<{ value: number; pct: number; over: boolean } | null>(null);
  const histRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const canBonus = listing.sqft != null && listing.sqft > 0;

  const last = guesses[guesses.length - 1];
  const wrongCount = guesses.filter((g) => !g.win).length;
  const specClue = !revealed && wrongCount > 0 ? clues[Math.min(wrongCount - 1, clues.length - 1)] : null;

  const finish = (all: Guess[]) => {
    setRevealed(true);
    const best = Math.min(...all.map((g) => g.pct));
    const bestIdx = all.findIndex((g) => g.pct === best);
    const won = best <= WIN_PCT;
    const points = scoreGuess(best, bestIdx + 1);
    requestAnimationFrame(() => {
      if (revealRef.current)
        gsap.fromTo(revealRef.current, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
    });
    // stash result; user advances with the button
    pending.current = { listingId: listing.id, bestPct: best, guesses: all.length, points, won, bonusPlayed: false };
  };

  const pending = useRef<ListingResult | null>(null);

  const submitSize = (value: number) => {
    const sqft = listing.sqft!;
    const pct = pctOff(value, sqft);
    setSizeGuess({ value, pct, over: value > sqft });
    setBonusPhase("done");
    const bp = scoreSize(pct);
    if (pending.current) {
      pending.current.points += bp;
      pending.current.bonusPlayed = true;
      pending.current.bonusPct = pct;
    }
    track("bonus_play", { accuracy: pctBucket(pct), points: bp });
  };

  const submit = (value: number) => {
    if (revealed) return;
    const pct = pctOff(value, actual);
    const g: Guess = { value, pct, high: value > actual, win: pct <= WIN_PCT };
    const all = [...guesses, g];
    setGuesses(all);
    track("guess_submit", { n: all.length, accuracy: pctBucket(pct) });
    requestAnimationFrame(() => {
      histRef.current?.scrollTo({ top: histRef.current.scrollHeight, behavior: "smooth" });
    });
    if (g.win || all.length >= MAX_GUESSES) finish(all);
  };

  const verdict = revealed ? accuracyLabel(Math.min(...guesses.map((g) => g.pct))) : null;

  return (
    <div>
      <div className="eyebrow rise" style={{ marginBottom: 8, opacity: 1, transform: "none" }}>
        ◇ Home {index + 1} of {total}
      </div>
      <div className="progress">
        {Array.from({ length: total }).map((_, k) => (
          <i key={k} className={k <= index ? "on" : ""} />
        ))}
      </div>

      <PhotoCarousel photos={listing.photos} tag={`${listing.city}, ${listing.state}`} />

      <div className="specs">
        {listing.beds != null && <div className="spec glass"><b>{listing.beds}</b><span>Beds</span></div>}
        {listing.baths != null && <div className="spec glass"><b>{listing.baths}</b><span>Baths</span></div>}
        <div className="spec glass"><b style={{ fontSize: 13 }}>{listing.type.split(" ")[0]}</b><span>Type</span></div>
      </div>

      {!revealed ? (
        <>
          {guesses.length > 0 && (
          <div className="sheet glass">
            <div className="sheet-h">
              <small>Your guesses</small>
              <small>{guesses.length}/{MAX_GUESSES} clues</small>
            </div>
            <div className="hist" ref={histRef}>
              {guesses.map((g, k) => (
                <div key={k} className={"g" + (k === guesses.length - 1 && g.pct <= 6 ? " warm" : "")}>
                  <div>
                    <div className="n">Guess {k + 1}</div>
                    <div className="val">{money(g.value)}</div>
                  </div>
                  <span className={"pill " + (g.high ? "high" : "low")}>{g.high ? "Too High" : "Too Low"}</span>
                </div>
              ))}
            </div>
            {last && (
              <div className="clue">
                <p>{momentumClue(last.value, actual)}</p>
                {specClue && <p className="spec-clue">Clue: {specClue}</p>}
              </div>
            )}
          </div>
          )}

          <GuessInput onSubmit={submit} />
        </>
      ) : (
        <div className="reveal glass" ref={revealRef}>
          <div className="lab">Actual list price</div>
          <div className="actual">{money(actual)}</div>
          <div className={"verdict " + verdict!.tone}>{verdict!.label}</div>
          <div className="mono" style={{ color: "var(--mut)", fontSize: 13 }}>
            best guess {Math.min(...guesses.map((g) => g.pct)).toFixed(1)}% off · {guesses.length} {guesses.length === 1 ? "try" : "tries"}
          </div>
          <div className="pts">+{pending.current?.points ?? 0} pts</div>
          {listing.description && <p className="desc">{listing.description}</p>}

          {canBonus && (
            <div className="bonus">
              {bonusPhase === "offer" && (
                <div className="bonus-offer">
                  <div className="bonus-tag">🎯 Bonus round</div>
                  <p>Now guess the size — one shot, up to <b>+300 pts</b>.</p>
                  <button className="cta sm" onClick={() => setBonusPhase("guessing")}>Guess the square footage</button>
                </div>
              )}
              {bonusPhase === "guessing" && (
                <>
                  <div className="bonus-tag">🎯 How big is it? (sq ft)</div>
                  <GuessInput cfg={SIZE_CFG} onSubmit={submitSize} />
                </>
              )}
              {bonusPhase === "done" && sizeGuess && (
                <div className="bonus-done">
                  <div className="lab">Actual size</div>
                  <div className="actual" style={{ fontSize: 28 }}>{listing.sqft!.toLocaleString()} sq ft</div>
                  <div className={"verdict " + sizeVerdict(sizeGuess.pct, sizeGuess.over).tone}>
                    {sizeVerdict(sizeGuess.pct, sizeGuess.over).label}
                  </div>
                  <div className="mono" style={{ color: "var(--mut)", fontSize: 13 }}>
                    you guessed {sizeGuess.value.toLocaleString()} · {sizeGuess.pct.toFixed(1)}% off
                  </div>
                  <div className="pts">+{scoreSize(sizeGuess.pct)} pts</div>
                </div>
              )}
            </div>
          )}

          <button className="cta sm" style={{ marginTop: 18 }} onClick={() => onComplete(pending.current!)}>
            {bonusPhase === "offer" && canBonus
              ? "Skip bonus →"
              : index + 1 < total ? "Next home →" : "See results →"}
          </button>
        </div>
      )}
    </div>
  );
}
