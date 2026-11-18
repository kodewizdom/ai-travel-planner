import React from 'react';

export default function HeroBanner({ activeHeroImage, activeHeroTitle }) {
  return (
    <div className="hero-banner-section">
      <div
        className="hero-banner-image"
        style={{ backgroundImage: `url(${activeHeroImage})` }}
      >
        <div className="hero-banner-overlay" />
        <div className="hero-content">
          <span className="hero-eyebrow">Explore India</span>
          <h2 className="hero-title">{activeHeroTitle}</h2>
        </div>
      </div>
    </div>
  );
}
