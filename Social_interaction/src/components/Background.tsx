import { useEffect, useRef } from "react";

/** Drifting constellation field behind everything — cheap, ambient, futuristic. */
export default function Background() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const x = c.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, pts: { x: number; y: number; vx: number; vy: number }[] = [];
    let raf = 0;

    const resize = () => {
      W = c.width = innerWidth * dpr;
      H = c.height = innerHeight * dpr;
      const n = Math.min(90, Math.floor(innerWidth / 14));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.18 * dpr, vy: (Math.random() - 0.5) * 0.18 * dpr,
      }));
    };
    resize();
    addEventListener("resize", resize);

    const link = 140 * dpr;
    const frame = () => {
      x.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) {
            x.strokeStyle = `rgba(120,180,255,${(1 - d / link) * 0.16})`;
            x.lineWidth = 1; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
          }
        }
      }
      x.fillStyle = "rgba(150,200,255,.55)";
      for (const p of pts) { x.beginPath(); x.arc(p.x, p.y, 1.4 * dpr, 0, 7); x.fill(); }
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);
  return <canvas id="bg" ref={ref} />;
}
