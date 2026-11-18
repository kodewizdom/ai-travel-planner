import React, { useState, useEffect } from 'react';

const FALLBACK_HERO = "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1500&q=85";

export default function HeroBanner({ activeHeroImage, activeHeroTitle }) {
  const [currentImg, setCurrentImg] = useState(activeHeroImage || FALLBACK_HERO);

  useEffect(() => {
    setCurrentImg(activeHeroImage || FALLBACK_HERO);
  }, [activeHeroImage]);

  return (
    <div className="hero-banner-section">
      <div
        className="hero-banner-image"
        style={{ backgroundImage: `url(${currentImg})` }}
      >
        <img
          src={currentImg}
          alt={activeHeroTitle || "Destination"}
          style={{ display: 'none' }}
          onError={() => {
            if (currentImg !== FALLBACK_HERO) {
              setCurrentImg(FALLBACK_HERO);
            }
          }}
        />
        <div className="hero-banner-overlay" />
        <div className="hero-content">
          <span className="hero-eyebrow">Explore India</span>
          <h2 className="hero-title">{activeHeroTitle}</h2>
        </div>
      </div>
    </div>
  );
}
