import { useEffect, useRef, useState } from "react";

export default function PhotoCarousel({ photos, tag }: { photos: string[]; tag: string }) {
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setI(0); setShowAll(false); setAutoScrolling(false); }, [photos]);
  useEffect(() => { setLoaded(false); }, [i, photos]);

  const n = photos.length;
  const go = (d: number) => setI((p) => (p + d + n) % n);

  const toggleShowAll = () => {
    if (!showAll) {
      setShowAll(true);
      setAutoScrolling(true);
      let currentIndex = 0;
      
      intervalRef.current = setInterval(() => {
        currentIndex++;
        if (currentIndex >= n) {
          clearInterval(intervalRef.current!);
          setAutoScrolling(false);
        } else {
          setI(currentIndex);
        }
      }, 1500);
    } else {
      setShowAll(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        setAutoScrolling(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
          <button className="navbtn l" onClick={() => go(-1)} aria-label="Previous photo" disabled={autoScrolling}>‹</button>
          <button className="navbtn r" onClick={() => go(1)} aria-label="Next photo" disabled={autoScrolling}>›</button>
          <div className="dots">
            {photos.map((_, k) => (
              <i key={k} className={k === i ? "on" : ""} />
            ))}
          </div>
          <button 
            className="show-all-btn"
            onClick={toggleShowAll}
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: showAll ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: autoScrolling ? 'not-allowed' : 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
              zIndex: 10,
            }}
            disabled={autoScrolling}
          >
            {autoScrolling ? 'Auto-scrolling...' : showAll ? 'Stop' : 'Show All'}
          </button>
        </>
      )}
    </div>
  );
}
