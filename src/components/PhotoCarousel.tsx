import { useEffect, useState } from "react";

export default function PhotoCarousel({ photos, tag }: { photos: string[]; tag: string }) {
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setI(0); }, [photos]);
  useEffect(() => { setLoaded(false); }, [i, photos]);

  const n = photos.length;
  const go = (d: number) => setI((p) => (p + d + n) % n);

  return (
    <div className="photo">
      {!loaded && <div className="skel" />}
      <img
        src={photos[i]}
        alt="Home for sale"
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity .3s" }}
      />
      <span className="tag">◈ {tag}</span>
      {n > 1 && (
        <>
          <button className="navbtn l" onClick={() => go(-1)} aria-label="Previous photo">‹</button>
          <button className="navbtn r" onClick={() => go(1)} aria-label="Next photo">›</button>
          <div className="dots">
            {photos.map((_, k) => (
              <i key={k} className={k === i ? "on" : ""} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
