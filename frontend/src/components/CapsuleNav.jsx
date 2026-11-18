import React from 'react';
import { Plane, Hotel, Utensils, MapPin } from 'lucide-react';

export default function CapsuleNav({ activeCapsule, setActiveCapsule }) {
  return (
    <div className="capsule-navigation-bar">
      <div className="capsule-button-container">
        <button
          type="button"
          className={`capsule-btn ${activeCapsule === 'flights' ? 'active' : ''}`}
          onClick={() => setActiveCapsule('flights')}
        >
          <Plane size={15} />
          <span>Flights</span>
        </button>

        <button
          type="button"
          className={`capsule-btn ${activeCapsule === 'hotels' ? 'active' : ''}`}
          onClick={() => setActiveCapsule('hotels')}
        >
          <Hotel size={15} />
          <span>Hotels</span>
        </button>

        <button
          type="button"
          className={`capsule-btn ${activeCapsule === 'restaurants' ? 'active' : ''}`}
          onClick={() => setActiveCapsule('restaurants')}
        >
          <Utensils size={15} />
          <span>Restaurants</span>
        </button>

        <button
          type="button"
          className={`capsule-btn ${activeCapsule === 'attractions' ? 'active' : ''}`}
          onClick={() => setActiveCapsule('attractions')}
        >
          <MapPin size={15} />
          <span>Places to Visit</span>
        </button>
      </div>
    </div>
  );
}
