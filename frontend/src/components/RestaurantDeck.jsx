import React from 'react';

export default function RestaurantDeck({ deckData, destination }) {
  return (
    <div className="deck-scrollable">
      <div className="deck-header-row">
        <div className="deck-summary">
          <h3>Restaurants</h3>
        </div>
      </div>

      <div className="stays-horizontal-list">
        {deckData.restaurants?.map((rest, idx) => (
          <article key={idx} className="stay-card-horizontal restaurant-card-horizontal">
            <div className="stay-thumb-box">
              <img
                src={rest.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=480&q=80"}
                alt={rest.name}
                className="stay-thumb-img"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=480&q=80";
                }}
              />
              <span className="illustrative-photo-badge">Illustrative photo</span>
            </div>

            <div className="stay-info-col">
              <h4 className="stay-property-name">{rest.name}</h4>
              <p className="stay-card-address">{rest.address || `${rest.name}, ${destination || 'City Center'}, India`}</p>
            </div>

            <div className="stay-card-actions">
              <a
                href={rest.maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rest.name + ' ' + (rest.address || destination || 'India'))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="stay-action-btn primary"
                title={`Open ${rest.name} on Google Maps`}
              >
                <span>Open Maps</span>
                <span className="btn-arrow">↗</span>
              </a>
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
