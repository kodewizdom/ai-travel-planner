import React from 'react';

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
