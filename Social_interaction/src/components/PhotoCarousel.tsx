import { useEffect, useRef, useState } from "react";

export default function PhotoCarousel({ photos, tag }: { photos: string[]; tag: string }) {
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const [galleryLoaded, setGalleryLoaded] = useState<boolean[]>([]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => { 
    setI(0); 
    setShowAll(false); 
    setAutoScrolling(false);
    setGalleryLoaded(new Array(photos.length).fill(false));
  }, [photos]);
  
  useEffect(() => { setLoaded(false); }, [i, photos]);

  const n = photos.length;
  const go = (d: number) => {
    setI((p) => (p + d + n) % n);
    stopAutoScroll();
  };

  const stopAutoScroll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setAutoScrolling(false);
    }
  };

  const startAutoScroll = () => {
    if (intervalRef.current) return;
    
    setAutoScrolling(true);
    intervalRef.current = setInterval(() => {
      setI((prev) => {
        const next = (prev + 1) % n;
        if (next === 0) {
          stopAutoScroll();
        }
        return next;
      });
    }, 1500);
  };

  const openGallery = () => {
    setShowAll(true);
    setI(0);
    // Preload all images
    photos.forEach((photo, index) => {
      const img = new Image();
      img.src = photo;
      img.onload = () => {
        setGalleryLoaded((prev) => {
          const updated = [...prev];
          updated[index] = true;
          return updated;
        });
      };
    });
    // Start auto-scroll after a brief delay
    setTimeout(() => startAutoScroll(), 300);
  };

  const closeGallery = () => {
    setShowAll(false);
    stopAutoScroll();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <>
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
            <button 
              className="show-all-btn"
              onClick={openGallery}
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
                zIndex: 10,
              }}
            >
              Show All
            </button>
          </>
        )}
      </div>

      {/* Full-screen Gallery Modal */}
      {showAll && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
          onClick={closeGallery}
        >
          {/* Close button */}
          <button
            onClick={closeGallery}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>

          {/* Auto-scroll control */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (autoScrolling) {
                stopAutoScroll();
              } else {
                startAutoScroll();
              }
            }}
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 16px',
              borderRadius: '20px',
              backgroundColor: autoScrolling ? 'rgba(255, 100, 100, 0.8)' : 'rgba(100, 255, 100, 0.8)',
              border: '2px solid white',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              zIndex: 10001,
              transition: 'all 0.2s',
            }}
          >
            {autoScrolling ? '⏸ Stop Auto-scroll' : '▶ Start Auto-scroll'}
          </button>

          {/* Image counter */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: '8px 16px',
              borderRadius: '20px',
              zIndex: 10001,
            }}
          >
            {i + 1} / {n}
          </div>

          {/* Main image container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Left arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              style={{
                position: 'absolute',
                left: '-60px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                color: 'white',
                fontSize: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ‹
            </button>

            {/* Image */}
            <img
              src={photos[i]}
              alt={`Home photo ${i + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
                opacity: galleryLoaded[i] ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
              }}
            />

            {/* Loading indicator */}
            {!galleryLoaded[i] && (
              <div
                style={{
                  position: 'absolute',
                  width: '60px',
                  height: '60px',
                  border: '4px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '4px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            )}

            {/* Right arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              style={{
                position: 'absolute',
                right: '-60px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                color: 'white',
                fontSize: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Add keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
