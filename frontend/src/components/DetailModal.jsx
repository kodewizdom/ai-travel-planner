import React from 'react';
import { X, Check, ExternalLink, MapPin, Send } from 'lucide-react';
import { getFlightBookingPortals } from '../utils/flightUtils';

export default function DetailModal({
  selectedItemDetail,
  setSelectedItemDetail,
  origin,
  destination,
  departureDate,
  returnDate,
  setInputText,
  isMobile,
  setMobileActiveTab
}) {
  if (!selectedItemDetail) return null;

  const portalContext = { origin, destination, departureDate, returnDate };

  return (
    <div className="modal-backdrop" onClick={() => setSelectedItemDetail(null)}>
      <div className="detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-type-tag">
              {selectedItemDetail.type.toUpperCase()} SPECIFICATIONS
            </span>
            <h3>
              {selectedItemDetail.type === 'flight' && `${selectedItemDetail.data.airline} · ${selectedItemDetail.data.flightNo}`}
              {selectedItemDetail.type === 'hotel' && selectedItemDetail.data.name}
              {selectedItemDetail.type === 'restaurant' && selectedItemDetail.data.name}
              {selectedItemDetail.type === 'attraction' && selectedItemDetail.data.name}
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setSelectedItemDetail(null)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* FLIGHT DETAILS */}
          {selectedItemDetail.type === 'flight' && (
            <div className="flight-detail-view">
              <div className="detail-summary-grid">
                <div className="summary-item">
                  <span className="summary-lbl">Route</span>
                  <span className="summary-val">{origin || 'Origin'} → {destination || 'Destination'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Schedule</span>
                  <span className="summary-val">{selectedItemDetail.data.departureTime} - {selectedItemDetail.data.arrivalTime}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Duration</span>
                  <span className="summary-val">{selectedItemDetail.data.duration} ({selectedItemDetail.data.stops})</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Aircraft Model</span>
                  <span className="summary-val">{selectedItemDetail.data.aircraft || 'Airbus / Boeing'}</span>
                </div>
              </div>

              <div className="detail-features-list">
                <h4>Fare Inclusions & Policies:</h4>
                <div className="feature-item">
                  <Check size={15} className="feature-icon" />
                  <span><strong>Baggage Allowance:</strong> {selectedItemDetail.data.baggage || '7 kg Cabin, 15 kg Checked Baggage'}</span>
                </div>
                <div className="feature-item">
                  <Check size={15} className="feature-icon" />
                  <span><strong>Cancellation & Rescheduling:</strong> Standard DGCA policy applies; refundable fares available upon checkout.</span>
                </div>
                <div className="feature-item">
                  <Check size={15} className="feature-icon" />
                  <span><strong>Terminal & Check-in:</strong> Web check-in opens 48 hours prior to domestic flight departure.</span>
                </div>
              </div>

              <div className="modal-cta-col">
                <div className="modal-cta-header">
                  <div className="fare-total">
                    <span>Total Fare:</span>
                    <strong>₹{selectedItemDetail.data.price?.toLocaleString('en-IN')}</strong>
                    <span className="fare-sub">per traveller</span>
                  </div>
                  <div className="booking-status-badge">
                    <span>Direct Booking Portals</span>
                  </div>
                </div>

                <div className="modal-portal-buttons">
                  {(() => {
                    const portals = getFlightBookingPortals(selectedItemDetail.data, false, portalContext);
                    return (
                      <>
                        <a
                          href={portals.airline.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="portal-btn btn-airline primary-portal"
                          title={`Book directly on ${portals.airline.name}`}
                        >
                          <span className="portal-btn-title">Book on {portals.airline.name}</span>
                          <span className="portal-btn-sub">Official Airline Portal · {selectedItemDetail.data.flightNo || portals.route}</span>
                          <ExternalLink size={13} className="portal-icon" />
                        </a>

                        <a
                          href={portals.googleFlights}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="portal-btn btn-gflights"
                          title={`Verify schedule on Google Flights (${portals.route})`}
                        >
                          <span className="portal-btn-title">Verify on Google Flights</span>
                          <span className="portal-btn-sub">{portals.route} · {portals.dateFormatted}</span>
                          <ExternalLink size={13} className="portal-icon" />
                        </a>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* HOTEL DETAILS */}
          {selectedItemDetail.type === 'hotel' && (
            <div className="hotel-detail-view">
              <div className="detail-summary-grid">
                <div className="summary-item">
                  <span className="summary-lbl">Classification</span>
                  <span className="summary-val">{selectedItemDetail.data.category}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Rating</span>
                  <span className="summary-val">★ {selectedItemDetail.data.rating} / 5</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Location</span>
                  <span className="summary-val">{selectedItemDetail.data.location}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Starting Price</span>
                  <span className="summary-val">₹{selectedItemDetail.data.pricePerNight?.toLocaleString('en-IN')} / night</span>
                </div>
              </div>

              <p className="modal-desc">{selectedItemDetail.data.description}</p>

              <div className="detail-features-list">
                <h4>Included Amenities & Highlights:</h4>
                {selectedItemDetail.data.amenities?.map((amenity, i) => (
                  <div key={i} className="feature-item">
                    <Check size={15} className="feature-icon" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>

              <div className="modal-cta-col">
                <div className="modal-cta-header">
                  <div className="fare-total">
                    <span>Nightly Tariff:</span>
                    <strong>₹{selectedItemDetail.data.pricePerNight?.toLocaleString('en-IN')}</strong>
                    <span className="fare-sub">per night</span>
                  </div>
                  <div className="booking-status-badge">
                    <span>MakeMyTrip Partner</span>
                  </div>
                </div>

                <div className="modal-portal-buttons">
                  <a
                    href={`https://www.makemytrip.com/hotels/hotel-listing/?city=${encodeURIComponent(destination || 'India')}&searchText=${encodeURIComponent(selectedItemDetail.data.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portal-btn btn-mmt"
                    title={`Book ${selectedItemDetail.data.name} on MakeMyTrip`}
                  >
                    <span className="portal-btn-title">Book on MakeMyTrip</span>
                    <span className="portal-btn-sub">Instant Hotel Booking</span>
                    <ExternalLink size={13} className="portal-icon" />
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedItemDetail.data.name + ' ' + (selectedItemDetail.data.location || destination || 'India'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portal-btn btn-airline"
                    title={`View ${selectedItemDetail.data.name} location on Google Maps`}
                  >
                    <span className="portal-btn-title">Check on Google Maps</span>
                    <span className="portal-btn-sub">{selectedItemDetail.data.location}</span>
                    <MapPin size={13} className="portal-icon" />
                  </a>

                  <button
                    type="button"
                    className="portal-btn btn-emt"
                    onClick={() => {
                      setInputText(`Tell me more about staying at ${selectedItemDetail.data.name} in ${selectedItemDetail.data.location} and nearby spots.`);
                      setSelectedItemDetail(null);
                      if (isMobile) setMobileActiveTab('chat');
                    }}
                  >
                    <span className="portal-btn-title">Ask AI Itinerary Guide</span>
                    <span className="portal-btn-sub">Add to Trip Plan</span>
                    <Send size={13} className="portal-icon" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RESTAURANT DETAILS */}
          {selectedItemDetail.type === 'restaurant' && (
            <div className="restaurant-detail-view">
              <div className="detail-summary-grid">
                <div className="summary-item">
                  <span className="summary-lbl">Cuisine</span>
                  <span className="summary-val">{selectedItemDetail.data.cuisine}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Average Cost</span>
                  <span className="summary-val">₹{selectedItemDetail.data.priceForTwo} for two</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Customer Rating</span>
                  <span className="summary-val">★ {selectedItemDetail.data.rating} / 5</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Locality</span>
                  <span className="summary-val">{selectedItemDetail.data.location}</span>
                </div>
              </div>

              <div className="detail-features-list">
                <h4>Specialty Dishes & Highlights:</h4>
                {selectedItemDetail.data.mustTry?.map((dish, i) => (
                  <div key={i} className="feature-item">
                    <Check size={15} className="feature-icon" />
                    <span>{dish}</span>
                  </div>
                ))}
              </div>

              <p className="modal-desc">
                <strong>Ambience: </strong> {selectedItemDetail.data.ambience}
              </p>

              <div className="modal-cta-col">
                <div className="modal-cta-header">
                  <div className="fare-total">
                    <span>Approx. Cost:</span>
                    <strong>₹{selectedItemDetail.data.priceForTwo}</strong>
                    <span className="fare-sub">for two diners</span>
                  </div>
                  <div className="booking-status-badge">
                    <span>Google Maps Verified</span>
                  </div>
                </div>

                <div className="modal-portal-buttons">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedItemDetail.data.name + ' ' + (selectedItemDetail.data.location || destination || 'India'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portal-btn btn-mmt"
                    title={`Open ${selectedItemDetail.data.name} on Google Maps`}
                  >
                    <span className="portal-btn-title">Check on Google Maps</span>
                    <span className="portal-btn-sub">{selectedItemDetail.data.location}</span>
                    <MapPin size={13} className="portal-icon" />
                  </a>

                  <button
                    type="button"
                    className="portal-btn btn-airline"
                    onClick={() => {
                      setInputText(`Recommend a dinner plan including ${selectedItemDetail.data.name} in ${destination || 'the city'}.`);
                      setSelectedItemDetail(null);
                      if (isMobile) setMobileActiveTab('chat');
                    }}
                  >
                    <span className="portal-btn-title">Add to Itinerary via Chat</span>
                    <span className="portal-btn-sub">Curate Dining Schedule</span>
                    <Send size={13} className="portal-icon" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ATTRACTION DETAILS */}
          {selectedItemDetail.type === 'attraction' && (
            <div className="attraction-detail-view">
              <div className="detail-summary-grid">
                <div className="summary-item">
                  <span className="summary-lbl">Type</span>
                  <span className="summary-val">{selectedItemDetail.data.category}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Recommended Hours</span>
                  <span className="summary-val">{selectedItemDetail.data.timings}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Entry Tariff</span>
                  <span className="summary-val">{selectedItemDetail.data.entryFee}</span>
                </div>
              </div>

              <div className="detail-features-list">
                <h4>Attraction Significance:</h4>
                <p className="modal-desc">{selectedItemDetail.data.highlights}</p>
              </div>

              <div className="modal-cta-col">
                <div className="modal-cta-header">
                  <div className="fare-total">
                    <span>Official Timings:</span>
                    <strong>{selectedItemDetail.data.timings?.split(',')[0]}</strong>
                    <span className="fare-sub">{selectedItemDetail.data.entryFee?.split(' · ')[0]}</span>
                  </div>
                  <div className="booking-status-badge">
                    <span>Google Maps Location</span>
                  </div>
                </div>

                <div className="modal-portal-buttons">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedItemDetail.data.name + ' ' + (selectedItemDetail.data.location || destination || 'India'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portal-btn btn-mmt"
                    title={`Open ${selectedItemDetail.data.name} on Google Maps`}
                  >
                    <span className="portal-btn-title">View Location & Directions on Google Maps</span>
                    <span className="portal-btn-sub">{selectedItemDetail.data.location || destination}</span>
                    <MapPin size={13} className="portal-icon" />
                  </a>

                  <button
                    type="button"
                    className="portal-btn btn-airline"
                    onClick={() => {
                      setInputText(`What is the best way to visit ${selectedItemDetail.data.name} and how much time should I spend?`);
                      setSelectedItemDetail(null);
                      if (isMobile) setMobileActiveTab('chat');
                    }}
                  >
                    <span className="portal-btn-title">Ask AI for Visiting Tips</span>
                    <span className="portal-btn-sub">Add to Day Itinerary</span>
                    <Send size={13} className="portal-icon" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
