import { LISTINGS as ALL_LISTINGS, type Listing } from "../data/listings";

/** Only use listings that have at least one photo */
export const LISTINGS = ALL_LISTINGS.filter(
  (listing) => listing.photos && listing.photos.length > 0
);

const KEY = 987654;

/** Decode a lightly-obfuscated price. Not real security — just keeps answers out of plain text in the bundle. */
export function decodePrice(p: string): number {
  try {
    return parseInt(atob(p), 10) ^ KEY;
  } catch {
    return 0;
  }
}

export const money = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-US");

export const shortMoney = (n: number) => {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + "M";
  if (n >= 1_000) return "$" + Math.round(n / 1000) + "K";
  return "$" + n;
};

/* ---------- deterministic daily pick ---------- */

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const EPOCH = new Date(2024, 0, 1).getTime();

function dayIndexFromKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const ms = new Date(y, m - 1, d).getTime();
  return Math.floor((ms - EPOCH) / 86_400_000);
}

/** Deterministic shuffle of [0..n) using a seeded RNG (Fisher-Yates). */
function shuffledIndices(n: number, seed: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  const rng = mulberry(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Two deterministic listings for today (same for everyone on the same date).
 * Rotates through every listing exactly once before any repeats: each "cycle"
 * (Math.floor(LISTINGS.length / 2) days) uses a fresh shuffle of all listings,
 * paired up two-per-day, so nothing repeats until the whole set has been shown.
 */
export function dailyListings(dateKey = todayKey()): Listing[] {
  const n = LISTINGS.length;
  const perDay = 2;
  const cycleLength = Math.max(1, Math.floor(n / perDay));
  const dayIndex = dayIndexFromKey(dateKey);
  const cycle = Math.floor(dayIndex / cycleLength);
  let pos = dayIndex % cycleLength;
  if (pos < 0) pos += cycleLength;

  const order = shuffledIndices(n, hashStr(`cycle:${cycle}`));
  const a = order[pos * 2];
  const b = order[pos * 2 + 1];
  return [LISTINGS[a], LISTINGS[b]];
}

/** N random listings for endless mode (no repeats within the batch). */
export function randomListings(n: number, exclude: number[] = []): Listing[] {
  const pool = LISTINGS.filter((l) => !exclude.includes(l.id));
  const out: Listing[] = [];
  const used = new Set<number>();
  while (out.length < n && used.size < pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    if (used.has(i)) continue;
    used.add(i);
    out.push(pool[i]);
  }
  return out;
}

/* ---------- scoring ---------- */

export const MAX_GUESSES = 5;
export const WIN_PCT = 2; // within 2% counts as a win

export function pctOff(guess: number, actual: number): number {
  return Math.abs(guess - actual) / actual * 100;
}

/** Points for a guess given accuracy and how many tries it took. */
export function scoreGuess(pct: number, guessNumber: number): number {
  let base: number;
  if (pct <= 1) base = 1000;
  else if (pct <= 2) base = 800;
  else if (pct <= 5) base = 500;
  else if (pct <= 10) base = 250;
  else if (pct <= 20) base = 100;
  else base = 25;
  // fewer guesses => keep more of the base
  const tryMult = [1, 0.85, 0.7, 0.55, 0.4][Math.min(guessNumber - 1, 4)];
  return Math.round(base * tryMult);
}

export function accuracyLabel(pct: number): { label: string; tone: "great" | "good" | "ok" | "off" } {
  if (pct <= 1) return { label: "Bullseye", tone: "great" };
  if (pct <= 2) return { label: "Nailed it", tone: "great" };
  if (pct <= 5) return { label: "In the ballpark", tone: "good" };
  if (pct <= 10) return { label: "Close-ish", tone: "ok" };
  if (pct <= 20) return { label: "Way off", tone: "off" };
  return { label: "Cold", tone: "off" };
}

/* ---------- bonus: size guess (single shot) ---------- */

/** Points for the optional square-footage guess. Smaller ceiling than price. */
export function scoreSize(pct: number): number {
  if (pct <= 3) return 300;
  if (pct <= 7) return 180;
  if (pct <= 15) return 90;
  if (pct <= 30) return 40;
  return 10;
}

export function sizeVerdict(pct: number, over: boolean): { label: string; tone: "great" | "good" | "ok" | "off" } {
  if (pct <= 3) return { label: "Spot on", tone: "great" };
  if (pct <= 7) return { label: "Very close", tone: "good" };
  if (pct <= 15) return { label: over ? "A bit too big" : "A bit too small", tone: "ok" };
  return { label: over ? "Way too big" : "Way too small", tone: "off" };
}

/* ---------- momentum clue (the addictive nudge) ---------- */

export function momentumClue(guess: number, actual: number): string {
  const high = guess > actual;
  const pct = pctOff(guess, actual);
  if (pct <= 2)
    return high
      ? "So close — shave off just a touch."
      : "Almost there — nudge it up a hair.";
  if (pct <= 6)
    return high
      ? "You overshot it, but you're close. Come down a little."
      : "Getting warm — push it up a bit more.";
  if (pct <= 15)
    return high
      ? "Too high. Ease off and try lower."
      : "Too low. Aim higher this time.";
  return high
    ? "Way over. Bring it down hard."
    : "Way under. Reach much higher.";
}

/* ---------- progressive spec clues ---------- */

export function buildClues(l: Listing): string[] {
  const clues: string[] = [];
  if (l.yearBuilt) clues.push(`Built in ${l.yearBuilt}.`);
  // sqft intentionally NOT revealed here — it's the bonus-round answer.
  if (l.lotSqft) {
    const acres = l.lotSqft / 43560;
    clues.push(
      acres >= 0.25
        ? `Sits on roughly ${acres.toFixed(2)} acres.`
        : `Lot is about ${l.lotSqft.toLocaleString()} sq ft.`
    );
  }
  if (l.features.length) clues.push(`Highlights: ${l.features.join(", ")}.`);
  if (l.garage) clues.push(`${l.garage}-car garage.`);
  if (l.neighborhood) clues.push(`Neighborhood: ${l.neighborhood}.`);
  return clues;
}

/* ---------- simulated leaderboard (no backend for the trial) ---------- */

const BOT_NAMES = [
  "quartzowl", "m_delacroix", "silverfern", "pixel_haus", "brixton",
  "no_lowball", "cashflow_cat", "tally_ho", "graniteway", "the_appraiser",
  "sunbeltsue", "condo_king", "wanderlist", "meridian", "openhouse_op",
];

export interface LbRow {
  rank: number;
  name: string;
  points: number;
  you?: boolean;
}

/** Build a believable ranking around the player's score. Same date+score => same board. */
export function simulatedLeaderboard(userPoints: number, dateKey = todayKey()): {
  rows: LbRow[];
  rank: number;
  total: number;
} {
  const seed = hashStr(dateKey + ":lb");
  const total = 120 + (seed % 90); // 120–209 players today
  // how many bots beat the user — higher score => better rank
  const strength = Math.min(0.98, Math.max(0.02, userPoints / 4200));
  const rank = Math.max(1, Math.round(total * (1 - strength)));

  const rng = mulberry(seed);
  const top: LbRow[] = [];
  let pts = 4200 - Math.floor(rng() * 300);
  for (let i = 0; i < 3; i++) {
    top.push({ rank: i + 1, name: BOT_NAMES[Math.floor(rng() * BOT_NAMES.length)], points: pts });
    pts -= 120 + Math.floor(rng() * 180);
  }
  const near: LbRow[] = [];
  if (rank > 1)
    near.push({ rank: rank - 1, name: "Anonymous", points: userPoints + 8 + Math.floor(rng() * 40) });
  near.push({ rank, name: "You", points: userPoints, you: true });
  near.push({ rank: rank + 1, name: "Anonymous", points: Math.max(0, userPoints - 8 - Math.floor(rng() * 40)) });

  return { rows: [...top, ...near], rank, total };
}

function mulberry(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
