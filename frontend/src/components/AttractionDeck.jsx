import React from 'react';

const FALLBACK_ATTRACTION_IMG = "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=480&q=80";

export default function AttractionDeck({
  deckData,
  destination,
  isLoading,
  handleAskAboutPlace
}) {
  return (
    <div className="deck-scrollable">
      <div className="deck-header-row">
        <div className="deck-summary">
          <h3>Places to Visit</h3>
        </div>
      </div>

      <div className="stays-horizontal-list">
        {deckData.attractions?.slice(0, 7).map((att, idx) => (
          <article key={idx} className="stay-card-horizontal attraction-card-horizontal">
            <div className="stay-thumb-box">
              <img
                src={att.image_url || FALLBACK_ATTRACTION_IMG}
                alt={att.name}
                className="stay-thumb-img"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_ATTRACTION_IMG;
                }}
              />
              <span className="illustrative-photo-badge">Tourist spot</span>
            </div>

            <div className="stay-info-col">
              <h4 className="stay-property-name">{att.name}</h4>
              <p className="stay-card-address">{att.address || `${att.name}, ${destination || 'City Center'}, India`}</p>
            </div>

            <div className="stay-card-actions attraction-actions">
              <a
                href={att.maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(att.name + ' ' + (att.address || destination || 'India'))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="stay-action-btn primary"
                title={`Open ${att.name} on Google Maps`}
              >
                <span>Open Maps</span>
                <span className="btn-arrow">↗</span>
              </a>

              <button
                type="button"
                className="stay-action-btn primary ask-about-btn"
                disabled={isLoading}
                onClick={() => handleAskAboutPlace(att)}
                title={`Ask the travel assistant about ${att.name}`}
              >
                <span>Ask about this place</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="provider-disclaimer">
        Verify prices and availability with the provider before booking.
      </div>
    </div>
  );
}
