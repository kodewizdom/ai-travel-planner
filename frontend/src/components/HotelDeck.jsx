import React from 'react';

export default function HotelDeck({ deckData, destination, onSelectHotel }) {
  return (
    <div className="deck-scrollable">
      <div className="deck-header-row">
        <div className="deck-summary">
          <h3>Hotels</h3>
          <p>{destination ? `Curated accommodations in ${destination}` : 'Select a destination on the left to see stays'}</p>
        </div>
      </div>

      <div className="stays-horizontal-list">
        {deckData.hotels?.map((hotel, idx) => (
          <article
            key={idx}
            className="stay-card-horizontal"
            onClick={() => onSelectHotel(hotel)}
          >
            <img
              src={hotel.image_url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"}
              alt={hotel.name}
              className="stay-card-thumb"
              loading="lazy"
            />
            <div className="stay-card-info">
              <h4 className="stay-card-name">{hotel.name}</h4>
              <div className="stay-card-rating">
                <span className="stay-star">★</span>
                <span>{hotel.rating || hotel.overall_rating || 4.5}</span>
                <span className="stay-review-count">
                  ({(hotel.reviews || hotel.reviewsCount || 1200).toLocaleString('en-IN')} reviews)
                </span>
              </div>
              {hotel.location && (
                <div className="stay-card-address">{hotel.location}</div>
              )}
            </div>

            <div className="stay-card-price-col">
              <div className="stay-price-amount">₹{(hotel.pricePerNight || hotel.nightly_rate || 1250).toLocaleString('en-IN')}.00</div>
              <div className="stay-price-unit">Per night</div>
            </div>

            <div className="stay-card-actions">
              {hotel.property_website ? (
                <a
                  href={hotel.property_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="stay-action-btn primary"
                  onClick={(e) => e.stopPropagation()}
                  title={`Visit ${hotel.name} official site`}
                >
                  <span>Visit property site</span>
                  <span className="btn-arrow">↗</span>
                </a>
              ) : (
                <a
                  href={hotel.search_link || `https://www.google.com/travel/hotels?q=${encodeURIComponent(hotel.name + ' ' + (destination || 'India'))}&curr=INR`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="stay-action-btn secondary"
                  onClick={(e) => e.stopPropagation()}
                  title={`Search ${hotel.name} on Google Hotels`}
                >
                  <span>Search hotel</span>
                  <span className="btn-arrow">↗</span>
                </a>
              )}
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
