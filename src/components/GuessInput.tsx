import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";

export interface InputConfig {
  min: number;
  max: number;
  step: number;
  initial: number;
  prefix?: string;   // e.g. "$"
  suffix?: string;   // e.g. " sq ft"
  minLabel: string;  // e.g. "$10K"
  maxLabel: string;  // e.g. "$10M"
  stepLabel: string; // e.g. "$10k"
  label: string;     // aria label
  submitLabel?: string;
}

export const PRICE_CFG: InputConfig = {
  min: 200_000, max: 10_000_000, step: 5_000, initial: 750_000,
  prefix: "$", minLabel: "$200K", maxLabel: "$10M", stepLabel: "$10k",
  label: "Price guess",
};

export const SIZE_CFG: InputConfig = {
  min: 200, max: 10_000, step: 25, initial: 1_800,
  suffix: " sq ft", minLabel: "200", maxLabel: "10,000", stepLabel: "100 sf",
  label: "Size guess", submitLabel: "Lock it in",
};

const fmt = (n: number) => n.toLocaleString("en-US");

export default function GuessInput({
  disabled,
  onSubmit,
  cfg = PRICE_CFG,
}: {
  disabled?: boolean;
  onSubmit: (value: number) => void;
  cfg?: InputConfig;
}) {
  const clamp = (v: number) => Math.max(cfg.min, Math.min(cfg.max, Math.round(v)));
  const bumpBy = cfg.prefix === "$" ? 10_000 : 100;
  const [val, setVal] = useState(cfg.initial);
  const [text, setText] = useState(fmt(cfg.initial));

  const set = (v: number) => {
    const c = clamp(v);
    setVal(c);
    setText(fmt(c));
  };

  const onType = (s: string) => {
    setText(s);
    const n = Number(s.replace(/[^0-9]/g, ""));
    if (n) setVal(clamp(n));
  };

  const submit = () => {
    if (disabled) return;
    const n = clamp(Number(text.replace(/[^0-9]/g, "")) || val);
    set(n);
    onSubmit(n);
  };

  return (
    <div className="guessbox glass">
      <div className="liveval">
        {cfg.prefix && <span className="c">{cfg.prefix}</span>}
        <span className="mono">{fmt(val)}</span>
        {cfg.suffix && <span className="c" style={{ fontSize: 20 }}>{cfg.suffix}</span>}
      </div>

      <Slider.Root
        className="SliderRoot"
        min={cfg.min}
        max={cfg.max}
        step={cfg.step}
        value={[val]}
        onValueChange={([v]) => set(v)}
        disabled={disabled}
        aria-label={cfg.label}
      >
        <Slider.Track className="SliderTrack">
          <Slider.Range className="SliderRange" />
        </Slider.Track>
        <Slider.Thumb className="SliderThumb" />
      </Slider.Root>
      <div className="rngends"><span>{cfg.minLabel}</span><span>{cfg.maxLabel}</span></div>

      <div className="steppers">
        <button onClick={() => set(val - bumpBy)} disabled={disabled} aria-label={"Decrease by " + cfg.stepLabel}>
          <b>−</b><span>{cfg.stepLabel}</span>
        </button>
        <button onClick={() => set(val + bumpBy)} disabled={disabled} aria-label={"Increase by " + cfg.stepLabel}>
          <b>+</b><span>{cfg.stepLabel}</span>
        </button>
      </div>

      <div className="typed">
        {cfg.prefix && <span className="d">{cfg.prefix}</span>}
        <input
          inputMode="numeric"
          value={text}
          disabled={disabled}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          onBlur={() => set(Number(text.replace(/[^0-9]/g, "")) || val)}
          aria-label={"Type your " + cfg.label.toLowerCase()}
        />
        <button className="sub" onClick={submit} disabled={disabled}>{cfg.submitLabel ?? "Submit"}</button>
      </div>
      <p className="hint">Slide · tap ± · or type — then submit</p>
    </div>
  );
}
