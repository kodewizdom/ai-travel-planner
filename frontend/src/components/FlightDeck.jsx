import React from 'react';
import { Plane, ExternalLink } from 'lucide-react';
import { getFlightBookingPortals } from '../utils/flightUtils';

export default function FlightDeck({
  deckData,
  origin,
  destination,
  departureDate,
  returnDate,
  tripType,
  flightSort,
  setFlightSort,
  sortedOutbound,
  sortedReturn,
  sortedFlights,
  onSelectFlight
}) {
  const portalContext = { origin, destination, departureDate, returnDate };
  const isRoundTripMode = (deckData.trip_type === 'round_trip' || tripType === 'round_trip') && sortedReturn.length > 0;

  return (
    <div className="deck-scrollable">
      <div className="deck-header-row">
        <div className="deck-summary">
          <h3>Available Flight Schedules</h3>
          <p>
            {origin && destination
              ? `${origin} to ${destination} · Direct & Connecting Options`
              : destination
                ? `Flights to ${destination}`
                : 'Popular Domestic Routes in India'}
          </p>
        </div>

        {/* Flight Sorting */}
        <div className="sort-pills">
          <button
            type="button"
            className={`sort-pill ${flightSort === 'recommended' ? 'active' : ''}`}
            onClick={() => setFlightSort('recommended')}
          >
            Recommended
          </button>
          <button
            type="button"
            className={`sort-pill ${flightSort === 'cheapest' ? 'active' : ''}`}
            onClick={() => setFlightSort('cheapest')}
          >
            Cheapest
          </button>
          <button
            type="button"
            className={`sort-pill ${flightSort === 'fastest' ? 'active' : ''}`}
            onClick={() => setFlightSort('fastest')}
          >
            Fastest
          </button>
        </div>
      </div>

      {isRoundTripMode ? (
        <>
          <div className="flight-leg-section">
            <div className="flight-leg-header">
              <h4>Outbound flights</h4>
              <span className="flight-leg-sub">
                {origin || 'Origin'} → {destination || 'Destination'} · {deckData.departure_date || departureDate}
              </span>
            </div>
            <div className="cards-grid">
              {sortedOutbound.map((flight, idx) => (
                <div
                  key={idx}
                  className="flight-card-compact"
                  onClick={() => onSelectFlight(flight)}
                >
                  <div className="compact-airline-col">
                    <div className="compact-airline-header">
                      <span className="compact-airline-name">{flight.airline}</span>
                      <span className="compact-flight-no">{flight.flightNo}</span>
                    </div>
                    <span className="compact-route-tag">{origin || 'Origin'} → {destination || 'Dest'}</span>
                  </div>

                  <div className="compact-times-col">
                    <div className="compact-time-range">
                      <span className="compact-time">{flight.departureTime}</span>
                      <div className="compact-flight-bar">
                        <span className="compact-duration">{flight.duration}</span>
                        <div className="compact-line">
                          <span className="compact-line-dot" />
                          <Plane size={11} className="compact-line-plane" />
                          <span className="compact-line-dot" />
                        </div>
                        <span className="compact-stops">{flight.stops}</span>
                      </div>
                      <span className="compact-time">{flight.arrivalTime}</span>
                    </div>
                  </div>

                  <div className="compact-fare-col">
                    <div className="compact-price">
                      <span className="compact-curr">₹</span>
                      <span className="compact-amount">{(flight.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {(() => {
                      const portals = getFlightBookingPortals(flight, false, portalContext);
                      return (
                        <a
                          href={portals.airline.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="compact-details-btn book-btn"
                          onClick={(e) => e.stopPropagation()}
                          title={`Book directly on ${portals.airline.name} (${flight.flightNo || portals.route})`}
                        >
                          <span>Book</span>
                          <ExternalLink size={11} />
                        </a>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flight-leg-section" style={{ marginTop: '1.25rem' }}>
            <div className="flight-leg-header">
              <h4>Return flights</h4>
              <span className="flight-leg-sub">
                {destination || 'Destination'} → {origin || 'Origin'} · {deckData.return_date || returnDate}
              </span>
            </div>
            <div className="cards-grid">
              {sortedReturn.map((flight, idx) => (
                <div
                  key={idx}
                  className="flight-card-compact"
                  onClick={() => onSelectFlight(flight)}
                >
                  <div className="compact-airline-col">
                    <div className="compact-airline-header">
                      <span className="compact-airline-name">{flight.airline}</span>
                      <span className="compact-flight-no">{flight.flightNo}</span>
                    </div>
                    <span className="compact-route-tag">{destination || 'Dest'} → {origin || 'Origin'}</span>
                  </div>

                  <div className="compact-times-col">
                    <div className="compact-time-range">
                      <span className="compact-time">{flight.departureTime}</span>
                      <div className="compact-flight-bar">
                        <span className="compact-duration">{flight.duration}</span>
                        <div className="compact-line">
                          <span className="compact-line-dot" />
                          <Plane size={11} className="compact-line-plane" />
                          <span className="compact-line-dot" />
                        </div>
                        <span className="compact-stops">{flight.stops}</span>
                      </div>
                      <span className="compact-time">{flight.arrivalTime}</span>
                    </div>
                  </div>

                  <div className="compact-fare-col">
                    <div className="compact-price">
                      <span className="compact-curr">₹</span>
                      <span className="compact-amount">{(flight.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {(() => {
                      const portals = getFlightBookingPortals(flight, true, portalContext);
                      return (
                        <a
                          href={portals.airline.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="compact-details-btn book-btn"
                          onClick={(e) => e.stopPropagation()}
                          title={`Book Return directly on ${portals.airline.name} (${flight.flightNo || portals.route})`}
                        >
                          <span>Book</span>
                          <ExternalLink size={11} />
                        </a>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="cards-grid">
          {sortedFlights.map((flight, idx) => (
            <div
              key={idx}
              className="flight-card-compact"
              onClick={() => onSelectFlight(flight)}
            >
              {/* Left: Airline info & status */}
              <div className="compact-airline-col">
                <div className="compact-airline-header">
                  <span className="compact-airline-name">{flight.airline}</span>
                  <span className="compact-flight-no">{flight.flightNo}</span>
                </div>
                {flight.status ? (
                  <span className="compact-tag">{flight.status}</span>
                ) : (
                  <span className="compact-route-tag">{origin || 'Origin'} → {destination || 'Dest'}</span>
                )}
              </div>

              {/* Center: Departure time, flight line & Arrival time */}
              <div className="compact-times-col">
                <div className="compact-time-range">
                  <span className="compact-time">{flight.departureTime}</span>
                  <div className="compact-flight-bar">
                    <span className="compact-duration">{flight.duration}</span>
                    <div className="compact-line">
                      <span className="compact-line-dot" />
                      <Plane size={11} className="compact-line-plane" />
                      <span className="compact-line-dot" />
                    </div>
                    <span className="compact-stops">{flight.stops}</span>
                  </div>
                  <span className="compact-time">{flight.arrivalTime}</span>
                </div>
              </div>

              {/* Right: Fare & View Details Button */}
              <div className="compact-fare-col">
                <div className="compact-price">
                  <span className="compact-curr">₹</span>
                  <span className="compact-amount">{(flight.price || 0).toLocaleString('en-IN')}</span>
                </div>
                {(() => {
                  const portals = getFlightBookingPortals(flight, false, portalContext);
                  return (
                    <a
                      href={portals.airline.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="compact-details-btn book-btn"
                      onClick={(e) => e.stopPropagation()}
                      title={`Book directly on ${portals.airline.name} (${flight.flightNo || portals.route})`}
                    >
                      <span>Book</span>
                      <ExternalLink size={11} />
                    </a>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
