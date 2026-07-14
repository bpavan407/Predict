import { useEffect, useState } from "react";

export default function PhotoCarousel({ photos, tag }: { photos: string[]; tag: string }) {
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [galleryLoaded, setGalleryLoaded] = useState<boolean[]>([]);

  useEffect(() => { 
    setI(0); 
    setShowAll(false);
    setGalleryLoaded(new Array(photos.length).fill(false));
  }, [photos]);
  
  useEffect(() => { setLoaded(false); }, [i, photos]);

  const n = photos.length;
  const go = (d: number) => {
    setI((p) => (p + d + n) % n);
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
  };

  const closeGallery = () => {
    setShowAll(false);
  };

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
            width: '100vw',
            height: '100vh',
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

          {/* Main image container - Full Width */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 80px',
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
                left: '20px',
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

            {/* Image - Full Width */}
            <img
              src={photos[i]}
              alt={`Home photo ${i + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
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
                right: '20px',
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
