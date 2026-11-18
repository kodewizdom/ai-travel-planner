import React from 'react';

export default function InitialDeckCard({ activeCapsule, isPlanningTrip }) {
  if (isPlanningTrip) {
    return (
      <div className="capsule-content-deck">
        <div className="initial-state-deck-card">
          <div className="initial-deck-header">
            <h3>
              {activeCapsule === 'flights' && 'Flights'}
              {activeCapsule === 'hotels' && 'Hotels'}
              {activeCapsule === 'restaurants' && 'Restaurants'}
              {activeCapsule === 'attractions' && 'Places to Visit'}
            </h3>
          </div>
          <p className="empty-state" role="status">Checking travel options…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="capsule-content-deck">
      <div className="initial-state-deck-card">
        <div className="initial-deck-header">
          <h3>
            {activeCapsule === 'flights' && 'Flights'}
            {activeCapsule === 'hotels' && 'Hotels'}
            {activeCapsule === 'restaurants' && 'Restaurants'}
            {activeCapsule === 'attractions' && 'Places to Visit'}
          </h3>
        </div>

        <div className="initial-deck-body">
          <div className="initial-deck-thumb-wrap">
            <img
              src={
                activeCapsule === 'flights'
                  ? "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=400&q=80"
                  : activeCapsule === 'hotels'
                    ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"
                    : activeCapsule === 'restaurants'
                      ? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80"
                      : "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80"
              }
              alt={activeCapsule}
              className="initial-deck-thumb"
            />
            <span className="illustrative-tag">Illustrative photo</span>
          </div>

          <div className="initial-deck-content">
            {activeCapsule === 'flights' && (
              <>
                <h4 className="initial-deck-title">Find flights for your route</h4>
                <p className="initial-deck-desc">
                  Choose your cities and travel dates to compare airlines and departure times.
                </p>
              </>
            )}
            {activeCapsule === 'hotels' && (
              <>
                <h4 className="initial-deck-title">Find a place to stay</h4>
                <p className="initial-deck-desc">
                  Plan an overnight trip to compare available hotels and nightly rates.
                </p>
              </>
            )}
            {activeCapsule === 'restaurants' && (
              <>
                <h4 className="initial-deck-title">Find places to eat</h4>
                <p className="initial-deck-desc">
                  Choose a destination to discover nearby restaurants and see them on the map.
                </p>
              </>
            )}
            {activeCapsule === 'attractions' && (
              <>
                <h4 className="initial-deck-title">Find places to visit</h4>
                <p className="initial-deck-desc">
                  Plan a trip to discover nearby sights and open their locations in Maps.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
