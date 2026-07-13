import { track as vercelTrack } from "@vercel/analytics";

/**
 * Funnel events for the trial. View them in Vercel dashboard → Analytics → Events.
 * Keep prop values to strings/numbers (Vercel requirement).
 */
export type EventName =
  | "play_start"       // daily round started
  | "endless_start"    // endless round started
  | "guess_submit"     // a guess was submitted
  | "home_complete"    // one listing finished (won or exhausted)
  | "round_complete"   // reached the results screen
  | "bonus_play"       // opted into the size bonus round
  | "share_click";     // tapped share results

export function track(name: EventName, props?: Record<string, string | number | boolean>) {
  try {
    vercelTrack(name, props);
  } catch {
    /* analytics must never break gameplay */
  }
}

/** Coarse accuracy bucket so events stay low-cardinality. */
export function pctBucket(pct: number): string {
  if (pct <= 1) return "<=1%";
  if (pct <= 2) return "<=2%";
  if (pct <= 5) return "<=5%";
  if (pct <= 10) return "<=10%";
  if (pct <= 20) return "<=20%";
  return ">20%";
}
