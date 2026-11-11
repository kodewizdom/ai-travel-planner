import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  RotateCcw,
  Bot,
  User,
  MoreVertical,
  Printer,
  Sun,
  Moon,
  Contrast,
  ChevronsLeft,
  ChevronsRight,
  Compass,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

const FALLBACK_CITIES = [
  "Agra", "Ahmedabad", "Amritsar", "Bengaluru (BLR)", "Bhopal", "Bhubaneswar",
  "Chandigarh", "Chennai (MAA)", "Coimbatore", "Dehradun", "Delhi (DEL)",
  "Goa (GOI)", "Guwahati", "Hyderabad (HYD)", "Indore", "Jaipur", "Jammu",
  "Kochi (COK)", "Kolkata (CCU)", "Lucknow", "Madurai", "Mangaluru",
  "Mumbai (BOM)", "Mysuru", "Nagpur", "Patna", "Pune (PNQ)", "Raipur",
  "Ranchi", "Srinagar", "Surat", "Thiruvananthapuram", "Tiruchirappalli",
  "Udaipur", "Vadodara", "Varanasi", "Visakhapatnam"
];

const LOADING_STEPS = [
  'Searching domestic flight routes and schedules',
  'Comparing accommodation and stay rates',
  'Identifying landmark attractions and dining',
  'Structuring day-by-day travel schedule',
  'Calculating budget and price allocation',
  'Finalizing itinerary details',
];

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export default function App() {
  const today = new Date();
  const defaultDeparture = new Date(today);
  defaultDeparture.setDate(today.getDate() + 14);

  const defaultReturn = new Date(defaultDeparture);
  defaultReturn.setDate(defaultDeparture.getDate() + 3);

  const [cities, setCities] = useState(FALLBACK_CITIES.map(c => ({ label: c, value: c.split(' (')[0] })));
  const [multiAirports, setMultiAirports] = useState({});
  const [origin, setOrigin] = useState('');
  const [originAirport, setOriginAirport] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationAirport, setDestinationAirport] = useState('');
  const [hotelPreference, setHotelPreference] = useState('tourist_attraction');
  const [tripType, setTripType] = useState('round_trip');
  const [flightsOnly, setFlightsOnly] = useState(true);
  const [travellers, setTravellers] = useState(2);
  const [budget, setBudget] = useState('');
  const [departureDate, setDepartureDate] = useState(formatDate(defaultDeparture));
  const [returnDate, setReturnDate] = useState(formatDate(defaultReturn));

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [serverStatus, setServerStatus] = useState({ provider: 'groq', model: 'openai/gpt-oss-120b' });

  // Theme & sidebar state (matching user design screenshots)
  const [theme, setTheme] = useState(() => localStorage.getItem('travel_planner_theme') || 'system');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 900 : false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth > 900 : true);

  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  const hasSearched = messages.length > 0;

  // Track window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile && !isSidebarOpen) {
        // Keep desktop sidebar open by default on wider screens
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Apply theme to document
  useEffect(() => {
    localStorage.setItem('travel_planner_theme', theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (theme === 'system') {
        const isDark = mediaQuery.matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    };

    applyTheme();

    const listener = () => {
      if (theme === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Click outside to close settings menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handlePrint = () => {
    setIsMenuOpen(false);
    window.print();
  };

  // Rotate loading step messages while LLM is generating
  useEffect(() => {
    let interval = null;
    if (isLoading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
      }, 2300);
    } else {
      setLoadingStepIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Fetch cities, multi-airports and server health on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.model) setServerStatus(data);
      })
      .catch(() => {});

    fetch('/api/cities')
      .then(res => res.json())
      .then(data => {
        if (data.cities && data.cities.length > 0) {
          setCities(data.cities);
        }
        if (data.multi_airports) {
          setMultiAirports(data.multi_airports);
        }
      })
      .catch(() => {});
  }, []);

  const handleOriginChange = (val) => {
    setOrigin(val);
    if (multiAirports[val] && multiAirports[val].length > 0) {
      setOriginAirport(multiAirports[val][0].code);
    } else {
      setOriginAirport('');
    }
  };

  const handleDestinationChange = (val) => {
    setDestination(val);
    if (multiAirports[val] && multiAirports[val].length > 0) {
      setDestinationAirport(multiAirports[val][0].code);
    } else {
      setDestinationAirport('');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, loadingStepIndex]);

  const handlePlanTrip = async (e) => {
    e.preventDefault();
    if (!origin || !destination) {
      alert('Please select both From and To cities.');
      return;
    }
    if (origin === destination) {
      alert('From and To cities must be different.');
      return;
    }

    const isFlightsOnlyMode = tripType === 'one_way' && flightsOnly;

    const payload = {
      origin,
      destination,
      origin_airport: originAirport || null,
      destination_airport: destinationAirport || null,
      hotel_preference: hotelPreference,
      trip_type: tripType,
      flights_only: isFlightsOnlyMode,
      travellers: Number(travellers),
      departure_date: departureDate,
      return_date: tripType === 'round_trip' ? returnDate : null,
      budget: budget.trim() ? budget.trim() : null,
      conversation_history: messages.map(m => ({ role: m.role, content: m.content }))
    };

    const origLabel = originAirport ? `${origin} (${originAirport})` : origin;
    const destLabel = destinationAirport ? `${destination} (${destinationAirport})` : destination;
    const hotelLabel = hotelPreference === 'near_airport' ? 'Airport Stay' : 'City Center';
    const tripLabel = tripType === 'round_trip' ? 'Round Trip' : 'One Way';
    const datesText = tripType === 'round_trip' ? `${departureDate} to ${returnDate}` : departureDate;
    const budgetText = budget.trim() ? ` · ₹${budget.trim()}` : '';

    const summaryText = isFlightsOnlyMode
      ? `${origLabel} → ${destLabel} · One Way (7-Day Fares from ${departureDate}) · ${travellers} travellers${budgetText}`
      : `${origLabel} → ${destLabel} · ${tripLabel} · ${travellers} travellers · ${hotelLabel} · ${datesText}${budgetText}`;

    setIsLoading(true);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to generate itinerary');
      }

      setMessages(prev => [
        ...prev,
        { role: 'user', content: data.prompt, isInternal: true, summary: summaryText },
        { role: 'assistant', content: data.reply }
      ]);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!hasSearched) return;
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    const newMessages = [...messages, { role: 'user', content: text, isInternal: false }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to process message');
      }

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `Error: ${err.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAll = () => {
    // Clear route and airport selections
    setOrigin('');
    setOriginAirport('');
    setDestination('');
    setDestinationAirport('');
    setHotelPreference('tourist_attraction');
    setTripType('round_trip');
    setFlightsOnly(true);
    setTravellers(2);
    setBudget('');

    // Recompute clean fresh departure & return dates
    const freshToday = new Date();
    const freshDep = new Date(freshToday);
    freshDep.setDate(freshToday.getDate() + 14);
    const freshRet = new Date(freshDep);
    freshRet.setDate(freshDep.getDate() + 3);
    setDepartureDate(formatDate(freshDep));
    setReturnDate(formatDate(freshRet));

    // Clear chat conversation, inputs, and loading state
    setMessages([]);
    setInputText('');
    setIsLoading(false);
    setLoadingStepIndex(0);

    // Ensure the sidebar form is open and ready
    setIsSidebarOpen(true);
  };

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Form */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h2>Trip Details</h2>
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={() => setIsSidebarOpen(false)}
              title="Close sidebar"
            >
              <ChevronsLeft size={18} />
            </button>
          </div>
          <div className="caption">Domestic routes in India</div>
        </div>

        <form onSubmit={handlePlanTrip}>
          {/* Origin */}
          <div className="form-group">
            <label>Origin</label>
            <select value={origin} onChange={e => handleOriginChange(e.target.value)} required>
              <option value="">Select origin...</option>
              {cities.map(c => (
                <option key={c.label} value={c.value}>{c.label}</option>
              ))}
            </select>
            {multiAirports[origin] && (
              <div className="airport-subselect">
                <span className="sub-label">Departure Airport</span>
                <select
                  value={originAirport}
                  onChange={e => setOriginAirport(e.target.value)}
                  className="airport-dropdown"
                >
                  {multiAirports[origin].map(ap => (
                    <option key={ap.code} value={ap.code}>{ap.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="form-group">
            <label>Destination</label>
            <select value={destination} onChange={e => handleDestinationChange(e.target.value)} required>
              <option value="">Select destination...</option>
              {cities.map(c => (
                <option key={c.label} value={c.value}>{c.label}</option>
              ))}
            </select>
            {multiAirports[destination] && (
              <div className="airport-subselect">
                <span className="sub-label">Arrival Airport</span>
                <select
                  value={destinationAirport}
                  onChange={e => setDestinationAirport(e.target.value)}
                  className="airport-dropdown"
                >
                  {multiAirports[destination].map(ap => (
                    <option key={ap.code} value={ap.code}>{ap.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Travel Type */}
          <div className="form-group">
            <label>Travel Type</label>
            <div className="radio-group">
              <button
                type="button"
                className={`radio-btn ${tripType === 'round_trip' ? 'active' : ''}`}
                onClick={() => setTripType('round_trip')}
              >
                Round Trip
              </button>
              <button
                type="button"
                className={`radio-btn ${tripType === 'one_way' ? 'active' : ''}`}
                onClick={() => setTripType('one_way')}
              >
                One Way
              </button>
            </div>

            {tripType === 'one_way' && (
              <div className="airport-subselect">
                <span className="sub-label">One-Way Mode</span>
                <div className="radio-group">
                  <button
                    type="button"
                    className={`radio-btn ${flightsOnly ? 'active' : ''}`}
                    onClick={() => setFlightsOnly(true)}
                  >
                    7-Day Flights Only
                  </button>
                  <button
                    type="button"
                    className={`radio-btn ${!flightsOnly ? 'active' : ''}`}
                    onClick={() => setFlightsOnly(false)}
                  >
                    Full Trip Plan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hotel Location Preference (hidden in Flights-Only mode) */}
          {!(tripType === 'one_way' && flightsOnly) && (
            <div className="form-group">
              <label>Hotel Location</label>
              <div className="preference-badge-group">
                <button
                  type="button"
                  className={`pref-btn ${hotelPreference === 'tourist_attraction' ? 'active' : ''}`}
                  onClick={() => setHotelPreference('tourist_attraction')}
                >
                  City Center
                </button>
                <button
                  type="button"
                  className={`pref-btn ${hotelPreference === 'near_airport' ? 'active' : ''}`}
                  onClick={() => setHotelPreference('near_airport')}
                >
                  Airport Transit
                </button>
              </div>
            </div>
          )}

          {/* Travellers & Budget */}
          <div className="form-row">
            <div className="form-group">
              <label>Travellers</label>
              <input
                type="number"
                min="1"
                max="9"
                value={travellers}
                onChange={e => setTravellers(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Budget (₹)</label>
              <input
                type="text"
                placeholder="e.g. 30000"
                value={budget}
                onChange={e => setBudget(e.target.value)}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-group">
              <label>{tripType === 'one_way' && flightsOnly ? 'Start Date' : 'Departure'}</label>
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
                required
              />
            </div>
            {tripType === 'one_way' && flightsOnly ? (
              <div className="form-group">
                <label>Window</label>
                <input
                  type="text"
                  value="7 Days (1 Week)"
                  disabled
                  readOnly
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Return</label>
                <input
                  type="date"
                  min={departureDate}
                  value={returnDate}
                  disabled={tripType === 'one_way'}
                  onChange={e => setReturnDate(e.target.value)}
                  required={tripType === 'round_trip'}
                />
              </div>
            )}
          </div>

          {/* Plan Trip Button */}
          <button type="submit" className="btn-primary" disabled={isLoading}>
            <span>
              {isLoading
                ? (tripType === 'one_way' && flightsOnly ? 'Comparing 7-Day Fares...' : 'Generating Plan...')
                : (tripType === 'one_way' && flightsOnly ? 'Search 7-Day Flights' : 'Generate Itinerary')}
            </span>
          </button>
        </form>

        <button type="button" className="btn-secondary" onClick={handleResetAll} title="Clear form and start a new trip">
          <RotateCcw size={14} />
          <span>Reset Form</span>
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className="main-chat">
        <header className="chat-header">
          <div className="chat-header-main">
            {(!isSidebarOpen || isMobile) && (
              <button
                type="button"
                className="sidebar-reopen-btn"
                onClick={() => setIsSidebarOpen(prev => !prev)}
                title="Configure Trip Details"
              >
                {isMobile ? <SlidersHorizontal size={15} /> : <ChevronsRight size={17} />}
                <span className="sidebar-btn-label">Trip Details</span>
              </button>
            )}
            <div className="header-titles">
              <h1>Travel Planner</h1>
              <p>Domestic routes, flight schedules, stays, and regional guides</p>
            </div>
          </div>

          {/* Options Menu Button & Dropdown */}
          <div className="header-menu-container" ref={menuRef}>
            <button
              type="button"
              className={`header-menu-btn ${isMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(prev => !prev)}
              title="Options"
            >
              <MoreVertical size={18} />
            </button>

            {isMenuOpen && (
              <div className="settings-dropdown">
                <div className="theme-toggle-row">
                  <button
                    type="button"
                    className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                    onClick={() => setTheme('system')}
                  >
                    <Contrast size={17} />
                    <span>System</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <Sun size={17} />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <Moon size={17} />
                    <span>Dark</span>
                  </button>
                </div>

                <div className="dropdown-divider" />

                <button
                  type="button"
                  className="dropdown-menu-item"
                  onClick={handlePrint}
                >
                  <Printer size={15} />
                  <span>Print Itinerary</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Messages Feed */}
        <div className="messages-container">
          {messages.length === 0 && !isLoading && (
            <div className="welcome-box">
              <div className="welcome-icon-wrapper">
                <Compass size={32} strokeWidth={1.5} />
              </div>
              <h3>Where to next?</h3>
              <p>
                Configure your route and dates in the sidebar to generate a complete travel itinerary.
              </p>
              <div className="quick-routes">
                <button
                  type="button"
                  className="route-chip"
                  onClick={() => {
                    handleOriginChange('Delhi');
                    handleDestinationChange('Goa');
                    if (isMobile) setIsSidebarOpen(true);
                  }}
                >
                  Delhi → Goa
                </button>
                <button
                  type="button"
                  className="route-chip"
                  onClick={() => {
                    handleOriginChange('Mumbai');
                    handleDestinationChange('Jaipur');
                    if (isMobile) setIsSidebarOpen(true);
                  }}
                >
                  Mumbai → Jaipur
                </button>
                <button
                  type="button"
                  className="route-chip"
                  onClick={() => {
                    handleOriginChange('Bengaluru');
                    handleDestinationChange('Kochi');
                    if (isMobile) setIsSidebarOpen(true);
                  }}
                >
                  Bengaluru → Kochi
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, index) => {
            if (msg.isInternal) {
              return (
                <div key={index} className="trip-pill-container">
                  <div className="trip-pill-badge">
                    <Compass size={14} />
                    <span>{msg.summary}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={index} className={`message-row ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="message-content markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            );
          })}

          {/* Active, animated multi-step loading card */}
          {isLoading && (
            <div className="message-row assistant">
              <div className="message-avatar">
                <Bot size={16} />
              </div>
              <div className="loading-card">
                <div className="loading-card-top">
                  <div className="step-counter-badge">
                    <span>0{loadingStepIndex + 1}</span>
                  </div>
                  <div className="loading-text-container">
                    <div className="loading-status-text">
                      {LOADING_STEPS[loadingStepIndex]}
                    </div>
                    <div className="loading-subtext">
                      Querying live aviation and accommodation datasets...
                    </div>
                  </div>
                </div>
                <div className="loading-progress-track">
                  <div
                    className="loading-progress-bar"
                    style={{
                      width: `${((loadingStepIndex + 1) / LOADING_STEPS.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Chat Input */}
        <div className={`chat-input-bar ${!hasSearched ? 'locked' : ''}`}>
          <form className="input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder={
                hasSearched
                  ? "Ask a follow-up or refine this itinerary..."
                  : "Generate an itinerary from the sidebar to ask questions..."
              }
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={isLoading || !hasSearched}
            />
            <button
              type="submit"
              className="btn-send"
              disabled={isLoading || !hasSearched || !inputText.trim()}
              title={hasSearched ? "Send message" : "Generate itinerary first"}
            >
              <Send size={15} />
            </button>
          </form>
          {!hasSearched && (
            <div className="input-locked-hint">
              Configure your trip details and click Generate Itinerary to start chatting.
            </div>
          )}
        </div>

        <div className="disclaimer-caption">
          Estimates only. Verify fares and schedules directly with service providers.
        </div>
      </main>
    </div>
  );
}
