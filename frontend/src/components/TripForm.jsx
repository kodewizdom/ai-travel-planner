import React from 'react';
import { Compass, RotateCcw, Minus, Plus, Plane } from 'lucide-react';
import { formatDate } from '../utils/flightUtils';

export default function TripForm({
  origin,
  handleOriginChange,
  destination,
  handleDestinationChange,
  originAirport,
  setOriginAirport,
  destinationAirport,
  setDestinationAirport,
  cities,
  multiAirports,
  tripType,
  setTripType,
  travellers,
  setTravellers,
  budget,
  setBudget,
  departureDate,
  setDepartureDate,
  returnDate,
  setReturnDate,
  isLoading,
  handlePlanTrip,
  handleResetAll,
  today = new Date()
}) {
  return (
    <div className="planner-embedded-card">
      <div className="planner-card-header">
        <div className="planner-card-title">
          <Compass size={18} className="gold-compass-icon" />
          <span>Plan your trip</span>
        </div>
        <button
          type="button"
          className="reset-trip-link"
          onClick={handleResetAll}
          title="Reset and clear trip form"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>

      <form className="embedded-trip-form" onSubmit={handlePlanTrip}>
        {/* Row 1: From & To */}
        <div className="form-grid-2">
          <div className="field-block">
            <label>From</label>
            <select
              value={origin}
              onChange={e => handleOriginChange(e.target.value)}
              className="clean-select"
              required
            >
              <option value="">Type a city...</option>
              {cities.map(c => (
                <option key={c.label} value={c.value}>{c.label}</option>
              ))}
            </select>
            {multiAirports[origin] && (
              <div className="airport-subfield">
                <label className="sub-label">Departure Airport</label>
                <select
                  value={originAirport}
                  onChange={e => setOriginAirport(e.target.value)}
                  className="sub-dropdown"
                >
                  {multiAirports[origin].map(ap => (
                    <option key={ap.code} value={ap.code}>{ap.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="field-block">
            <label>To</label>
            <select
              value={destination}
              onChange={e => handleDestinationChange(e.target.value)}
              className="clean-select"
              required
            >
              <option value="">Type a city...</option>
              {cities.map(c => (
                <option key={c.label} value={c.value}>{c.label}</option>
              ))}
            </select>
            {multiAirports[destination] && (
              <div className="airport-subfield">
                <label className="sub-label">Arrival Airport</label>
                <select
                  value={destinationAirport}
                  onChange={e => setDestinationAirport(e.target.value)}
                  className="sub-dropdown"
                >
                  {multiAirports[destination].map(ap => (
                    <option key={ap.code} value={ap.code}>{ap.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Travel type pills */}
        <div className="field-block">
          <label>Travel type</label>
          <div className="travel-type-pills">
            <button
              type="button"
              className={`travel-type-pill ${tripType === 'round_trip' ? 'active' : ''}`}
              onClick={() => setTripType('round_trip')}
            >
              <span className="pill-symbol">⇄</span>
              <span>Round trip</span>
            </button>
            <button
              type="button"
              className={`travel-type-pill ${tripType === 'one_way' ? 'active' : ''}`}
              onClick={() => setTripType('one_way')}
            >
              <span className="pill-symbol">—</span>
              <span>One-way</span>
            </button>
          </div>
        </div>

        {/* Row 3: Travellers stepper & Budget (optional) */}
        <div className="form-grid-2">
          <div className="field-block">
            <label>Travellers</label>
            <div className="stepper-field">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setTravellers(prev => Math.max(1, prev - 1))}
                disabled={travellers <= 1}
              >
                <Minus size={13} />
              </button>
              <span className="stepper-val">{travellers}</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setTravellers(prev => Math.min(9, prev + 1))}
                disabled={travellers >= 9}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          <div className="field-block">
            <label>Budget (optional)</label>
            <div className="budget-input-wrapper">
              <input
                type="text"
                placeholder="₹ e.g. 30000"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="clean-input"
              />
            </div>
          </div>
        </div>

        {/* Row 4: Departure & Return dates */}
        <div className="form-grid-2">
          <div className="field-block">
            <label>Departure</label>
            <input
              type="date"
              min={formatDate(today)}
              value={departureDate}
              onChange={e => {
                setDepartureDate(e.target.value);
                if (returnDate < e.target.value) {
                  setReturnDate(e.target.value);
                }
              }}
              className="clean-input"
              required
            />
          </div>

          <div className="field-block">
            <label>Return</label>
            {tripType === 'round_trip' ? (
              <input
                type="date"
                min={departureDate}
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                className="clean-input"
                required
              />
            ) : (
              <div className="clean-input disabled-placeholder">
                <span>One-way</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Trip Button */}
        <button
          type="submit"
          className="submit-trip-btn"
          disabled={isLoading}
        >
          <Plane size={16} />
          <span>
            {isLoading
              ? 'Finding Flights & Travel Options...'
              : 'Find Flights & Plan Itinerary'}
          </span>
        </button>
      </form>

      {/* Popular Quick Routes */}
      <div className="quick-suggestions">
        <span className="suggestion-label">Quick select:</span>
        <button
          type="button"
          className="quick-chip"
          onClick={() => {
            handleOriginChange('Delhi');
            handleDestinationChange('Udaipur');
          }}
        >
          Delhi → Udaipur
        </button>
        <button
          type="button"
          className="quick-chip"
          onClick={() => {
            handleOriginChange('Mumbai');
            handleDestinationChange('Jaipur');
          }}
        >
          Mumbai → Jaipur
        </button>
        <button
          type="button"
          className="quick-chip"
          onClick={() => {
            handleOriginChange('Delhi');
            handleDestinationChange('Goa');
          }}
        >
          Delhi → Goa
        </button>
      </div>
    </div>
  );
}
