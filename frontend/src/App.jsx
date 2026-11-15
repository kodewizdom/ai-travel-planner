import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  RotateCcw,
  Bot,
  User,
  Plane,
  Hotel,
  Utensils,
  MapPin,
  Compass,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
  Sun,
  Moon,
  Contrast,
  Printer,
  X,
  Sparkles,
  SlidersHorizontal,
  Info,
  Check
} from 'lucide-react';

import { DEFAULT_INDIA_BANNERS, getDestinationData } from './destinationData';

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

  // Core Form State
  const [cities, setCities] = useState(FALLBACK_CITIES.map(c => ({ label: c, value: c.split(' (')[0] })));
  const [multiAirports, setMultiAirports] = useState({});
  const [origin, setOrigin] = useState('');
  const [originAirport, setOriginAirport] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationAirport, setDestinationAirport] = useState('');
  const [tripType, setTripType] = useState('one_way');
  const [flightsOnly, setFlightsOnly] = useState(true);
  const [hotelPreference, setHotelPreference] = useState('tourist_attraction');
  const [travellers, setTravellers] = useState(1);
  const [budget, setBudget] = useState('');
  const [departureDate, setDepartureDate] = useState(formatDate(defaultDeparture));
  const [returnDate, setReturnDate] = useState(formatDate(defaultReturn));

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // App Theme: defaults to system without manual selection needed
  const [theme, setTheme] = useState(() => localStorage.getItem('travel_planner_theme') || 'system');
  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Mobile Tab View State ("chat" or "explorer")
  const [mobileActiveTab, setMobileActiveTab] = useState('chat');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  // Right Section State
  const [activeCapsule, setActiveCapsule] = useState('flights');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [flightSort, setFlightSort] = useState('recommended');

  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);

  const hasSearched = messages.some(m => m.role === 'assistant');

  // Load destination details reactively
  const destinationData = getDestinationData(destination);
  const banners = destination ? destinationData.banners : DEFAULT_INDIA_BANNERS;

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track system dark mode changes automatically
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDarkMode = theme === 'system' ? systemIsDark : theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = isDarkMode ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('travel_planner_theme', nextTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Auto-rotate Hero Banner every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % banners.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Reset banner index when destination changes
  useEffect(() => {
    setBannerIndex(0);
  }, [destination]);

  // Loading steps progress animation
  useEffect(() => {
    let interval = null;
    if (isLoading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
      }, 2400);
    } else {
      setLoadingStepIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Fetch cities and multi-airports on mount
  useEffect(() => {
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
    if (e) e.preventDefault();
    if (!origin || !destination) {
      alert('Please select both Origin and Destination cities.');
      return;
    }
    if (origin === destination) {
      alert('Origin and Destination cities must be different.');
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
      ? `${origLabel} → ${destLabel} · One Way (7-Day Fares from ${departureDate}) · ${travellers} traveller${travellers > 1 ? 's' : ''}${budgetText}`
      : `${origLabel} → ${destLabel} · ${tripLabel} · ${travellers} traveller${travellers > 1 ? 's' : ''} · ${hotelLabel} · ${datesText}${budgetText}`;

    setIsLoading(true);

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

      // Automatically focus on flight results tab in explorer
      setActiveCapsule('flights');
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
    setOrigin('');
    setOriginAirport('');
    setDestination('');
    setDestinationAirport('');
    setTripType('one_way');
    setFlightsOnly(true);
    setHotelPreference('tourist_attraction');
    setTravellers(1);
    setBudget('');

    const freshToday = new Date();
    const freshDep = new Date(freshToday);
    freshDep.setDate(freshToday.getDate() + 14);
    const freshRet = new Date(freshDep);
    freshRet.setDate(freshDep.getDate() + 3);
    setDepartureDate(formatDate(freshDep));
    setReturnDate(formatDate(freshRet));

    setMessages([]);
    setInputText('');
    setIsLoading(false);
    setLoadingStepIndex(0);
    setActiveCapsule('flights');
    setBannerIndex(0);
    setSelectedItemDetail(null);
  };

  const handlePrint = () => {
    setIsMenuOpen(false);
    window.print();
  };

  // Sort flights based on active sort pill
  const sortedFlights = [...(destinationData.flights || [])].sort((a, b) => {
    if (flightSort === 'cheapest') return a.price - b.price;
    if (flightSort === 'fastest') return a.duration.localeCompare(b.duration);
    return 0; // recommended
  });

  // Indian Airport IATA Code Mapping
  const IATA_MAP = {
    'delhi': 'DEL', 'new delhi': 'DEL',
    'mumbai': 'BOM', 'bombay': 'BOM',
    'bengaluru': 'BLR', 'bangalore': 'BLR',
    'goa': 'GOI', 'south goa': 'GOI', 'north goa': 'GOX', 'mopa': 'GOX', 'dabolim': 'GOI',
    'jaipur': 'JAI',
    'kochi': 'COK', 'cochin': 'COK',
    'kolkata': 'CCU', 'calcutta': 'CCU',
    'chennai': 'MAA', 'madras': 'MAA',
    'hyderabad': 'HYD',
    'ahmedabad': 'AMD',
    'pune': 'PNQ',
    'lucknow': 'LKO',
    'chandigarh': 'IXC',
    'guwahati': 'GAU',
    'varanasi': 'VNS',
    'srinagar': 'SXR',
    'amritsar': 'ATQ',
    'bhubaneswar': 'BBI',
    'indore': 'IDR',
    'patna': 'PAT',
    'dehradun': 'DED',
    'agra': 'AGR',
    'bhopal': 'BHO',
    'coimbatore': 'CJB',
    'madurai': 'IXM',
    'mangaluru': 'IXE', 'mangalore': 'IXE',
    'nagpur': 'NAG',
    'raipur': 'RPR',
    'ranchi': 'IXR',
    'surat': 'STV',
    'thiruvananthapuram': 'TRV', 'trivandrum': 'TRV',
    'vadodara': 'BDQ',
    'visakhapatnam': 'VTZ', 'vizag': 'VTZ',
    'port blair': 'IXZ',
    'leh': 'IXL',
    'bagdogra': 'IXB',
    'jodhpur': 'JDH',
    'udaipur': 'UDR',
    'shirdi': 'SAG',
    'tirupati': 'TIR'
  };

  const resolveIATA = (val, fallback = 'DEL') => {
    if (!val) return fallback;
    const str = String(val).trim();
    if (/^[A-Z]{3}$/.test(str)) return str;
    const match = str.match(/\(([A-Z]{3})\)/);
    if (match) return match[1];
    const clean = str.toLowerCase().split(' (')[0].split(',')[0].trim();
    return IATA_MAP[clean] || fallback;
  };

  const formatPortalDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Generate authentic direct booking portal links (MakeMyTrip, Official Airline, EaseMyTrip)
  const getFlightBookingPortals = (flight) => {
    const origIata = resolveIATA(originAirport || origin, 'DEL');
    const destIata = resolveIATA(destinationAirport || destination, 'GOI');
    const dDate = departureDate || formatDate(new Date());
    const ddmmyyyy = formatPortalDate(dDate);
    const pax = travellers || 1;

    // 1. MakeMyTrip (India's leading flight booking portal)
    const mmtUrl = `https://www.makemytrip.com/flight/search?itinerary=${origIata}-${destIata}-${ddmmyyyy}&tripType=O&paxType=A-${pax}_C-0_I-0&intl=false&cabinClass=E`;

    // 2. EaseMyTrip (Zero convenience fee portal)
    const emtUrl = `https://flight.easemytrip.com/FlightList/Index?srch=${origIata}-${destIata}-${ddmmyyyy}&px=${pax}-0-0&cbn=0&ar=undefined&isqs=true`;

    // 3. Airline Official Portal
    const airlineName = flight?.airline || 'Airline';
    const airlineLower = airlineName.toLowerCase();
    let airlineUrl = 'https://www.goindigo.in/';
    let airlineLabel = `${airlineName} Official`;

    if (airlineLower.includes('indigo')) {
      airlineUrl = 'https://www.goindigo.in/';
      airlineLabel = 'IndiGo Official';
    } else if (airlineLower.includes('air india express')) {
      airlineUrl = 'https://www.airindiaexpress.com/';
      airlineLabel = 'Air India Express';
    } else if (airlineLower.includes('air india')) {
      airlineUrl = 'https://www.airindia.com/';
      airlineLabel = 'Air India Official';
    } else if (airlineLower.includes('akasa')) {
      airlineUrl = 'https://www.akasaair.com/';
      airlineLabel = 'Akasa Air Official';
    } else if (airlineLower.includes('spicejet')) {
      airlineUrl = 'https://www.spicejet.com/';
      airlineLabel = 'SpiceJet Official';
    }

    return {
      mmt: mmtUrl,
      emt: emtUrl,
      airline: { name: airlineLabel, url: airlineUrl },
      route: `${origIata} → ${destIata}`,
      dateFormatted: ddmmyyyy
    };
  };

  const currentBanner = banners[bannerIndex] || banners[0];

  return (
    <div className="app-viewport">
      {/* SIDEBAR NAVIGATION (Left sidebar on laptop, top navbar on tablet/mobile) */}
      <aside className="app-sidebar-nav">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img
              src="/logo.png"
              alt="Dream travel agency Logo"
              className="sidebar-logo-img"
            />
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">Dream travel agency</span>
              <span className="sidebar-brand-subtitle">Ai-agent</span>
            </div>
          </div>

          {/* Quick Nav: Trip Planner */}
          <nav className="sidebar-nav-links">
            <button
              type="button"
              className="sidebar-nav-item active"
              onClick={() => {
                setActiveCapsule('flights');
                if (isMobile) setMobileActiveTab('chat');
              }}
            >
              <Compass size={17} />
              <span>Trip Planner</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Borderless Theme Toggle */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-theme-toggle-btn"
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} strokeWidth={1.8} /> : <Moon size={20} strokeWidth={1.8} />}
            <span className="theme-toggle-label">
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
          <div className="sidebar-footer-caption">Domestic India</div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="app-main-workspace">
        {/* Mobile Top View Switcher */}
        {isMobile && (
          <div className="mobile-tab-bar">
            <button
              type="button"
              className={`mobile-tab-btn ${mobileActiveTab === 'chat' ? 'active' : ''}`}
              onClick={() => setMobileActiveTab('chat')}
            >
              <Bot size={16} />
              <span>AI Travel Chat</span>
            </button>
            <button
              type="button"
              className={`mobile-tab-btn ${mobileActiveTab === 'explorer' ? 'active' : ''}`}
              onClick={() => setMobileActiveTab('explorer')}
            >
              <Compass size={16} />
              <span>Visual Explorer</span>
            </button>
          </div>
        )}

        <div className="layout-split-container">
          {/* ================= LEFT 50% PANEL: CHATBOT & EMBEDDED TRIP FORM ================= */}
          <div className={`panel-left ${isMobile && mobileActiveTab !== 'chat' ? 'hidden-mobile' : ''}`}>
            {/* Scrollable Chat Area */}
            <div className="chat-feed" ref={chatScrollRef}>
              {/* INITIAL GREETING MESSAGE & EMBEDDED TRIP PLANNER INPUT CARD */}
              <div className="message-row assistant">
                <div className="avatar-bot">
                  <Bot size={17} />
                </div>
                <div className="greeting-card">
                  <div className="greeting-header">
                    <div className="greeting-header-row">
                      <h3>Namaste! Where would you like to travel?</h3>
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
                    <p>
                      I can help you compare live domestic flights, find verified stays, and generate full travel plans across India. Select your route below to get started:
                    </p>
                  </div>

                {/* TRIP INPUT SECTION EMBEDDED INSIDE THE CHAT ONLY */}
                <form className="embedded-trip-form" onSubmit={handlePlanTrip}>
                  {/* Origin & Destination Grid */}
                  <div className="form-grid-2">
                    <div className="field-block">
                      <label>From (Origin)</label>
                      <select
                        value={origin}
                        onChange={e => handleOriginChange(e.target.value)}
                        required
                      >
                        <option value="">Select origin city...</option>
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
                      <label>To (Destination)</label>
                      <select
                        value={destination}
                        onChange={e => handleDestinationChange(e.target.value)}
                        required
                      >
                        <option value="">Select destination city...</option>
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

                  {/* Travel Type: One Way vs Round Trip */}
                  <div className="field-block">
                    <label>Travel Type</label>
                    <div className="segmented-toggle">
                      <button
                        type="button"
                        className={`segment-btn ${tripType === 'one_way' ? 'active' : ''}`}
                        onClick={() => setTripType('one_way')}
                      >
                        One Way
                      </button>
                      <button
                        type="button"
                        className={`segment-btn ${tripType === 'round_trip' ? 'active' : ''}`}
                        onClick={() => setTripType('round_trip')}
                      >
                        Round Trip
                      </button>
                    </div>

                    {/* If One-Way: Option for 7-Day Flights Only vs Full Trip Plan */}
                    {tripType === 'one_way' && (
                      <div className="submode-box">
                        <span className="sub-label">One-Way Feature Mode:</span>
                        <div className="segmented-toggle small">
                          <button
                            type="button"
                            className={`segment-btn ${flightsOnly ? 'active' : ''}`}
                            onClick={() => setFlightsOnly(true)}
                          >
                            7-Day Flight Fare Calendar
                          </button>
                          <button
                            type="button"
                            className={`segment-btn ${!flightsOnly ? 'active' : ''}`}
                            onClick={() => setFlightsOnly(false)}
                          >
                            Full Travel Plan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date Selection: If One-Way, REMOVE Return Date completely! */}
                  <div className="form-grid-2">
                    <div className="field-block">
                      <label>
                        {tripType === 'one_way' && flightsOnly ? 'Start Date (7-Day Window)' : 'Departure Date'}
                      </label>
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

                    {/* ONLY DISPLAY RETURN DATE IF ROUND TRIP */}
                    {tripType === 'round_trip' ? (
                      <div className="field-block">
                        <label>Return Date</label>
                        <input
                          type="date"
                          min={departureDate}
                          value={returnDate}
                          onChange={e => setReturnDate(e.target.value)}
                          required
                        />
                      </div>
                    ) : (
                      <div className="field-block">
                        <label>Return Date</label>
                        <div className="one-way-notice">
                          <span>Not applicable for One Way travel</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Travellers & Budget */}
                  <div className="form-grid-2">
                    <div className="field-block">
                      <label>Travellers</label>
                      <input
                        type="number"
                        min="1"
                        max="9"
                        value={travellers}
                        onChange={e => setTravellers(Math.max(1, parseInt(e.target.value) || 1))}
                        required
                      />
                    </div>

                    <div className="field-block">
                      <label>Budget (₹ Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 25000"
                        value={budget}
                        onChange={e => setBudget(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Hotel Preference (only when full trip plan) */}
                  {!(tripType === 'one_way' && flightsOnly) && (
                    <div className="field-block">
                      <label>Hotel Preference</label>
                      <div className="segmented-toggle">
                        <button
                          type="button"
                          className={`segment-btn ${hotelPreference === 'tourist_attraction' ? 'active' : ''}`}
                          onClick={() => setHotelPreference('tourist_attraction')}
                        >
                          City Center Sights
                        </button>
                        <button
                          type="button"
                          className={`segment-btn ${hotelPreference === 'near_airport' ? 'active' : ''}`}
                          onClick={() => setHotelPreference('near_airport')}
                        >
                          Airport / Transit Hub
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form Submit Button */}
                  <button
                    type="submit"
                    className="submit-trip-btn"
                    disabled={isLoading}
                  >
                    <Plane size={16} />
                    <span>
                      {isLoading
                        ? (tripType === 'one_way' && flightsOnly ? 'Searching 7-Day Live Flights...' : 'Generating Travel Itinerary...')
                        : (tripType === 'one_way' && flightsOnly ? 'Search 7-Day Flights & Fares' : 'Generate Full Travel Itinerary')}
                    </span>
                  </button>
                </form>

                {/* Popular Indian Quick Routes */}
                <div className="quick-suggestions">
                  <span className="suggestion-label">Quick select:</span>
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
                      handleOriginChange('Hyderabad');
                      handleDestinationChange('Patna');
                    }}
                  >
                    Hyderabad → Patna
                  </button>
                  <button
                    type="button"
                    className="quick-chip"
                    onClick={() => {
                      handleOriginChange('Bengaluru');
                      handleDestinationChange('Kochi');
                    }}
                  >
                    Bengaluru → Kochi
                  </button>
                </div>
              </div>
            </div>

            {/* CONVERSATION MESSAGES */}
            {messages.map((msg, index) => {
              if (msg.isInternal) {
                return (
                  <div key={index} className="trip-pill-row">
                    <div className="trip-pill-tag">
                      <Compass size={14} />
                      <span>{msg.summary}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className={`message-row ${msg.role}`}>
                  <div className={msg.role === 'user' ? 'avatar-user' : 'avatar-bot'}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="message-bubble markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            })}

            {/* LOADING CARD */}
            {isLoading && (
              <div className="message-row assistant">
                <div className="avatar-bot">
                  <Bot size={16} />
                </div>
                <div className="loading-stage-box">
                  <div className="loading-top-info">
                    <span className="step-num">Step 0{loadingStepIndex + 1}</span>
                    <span className="step-name">{LOADING_STEPS[loadingStepIndex]}</span>
                  </div>
                  <div className="loading-track">
                    <div
                      className="loading-fill"
                      style={{
                        width: `${((loadingStepIndex + 1) / LOADING_STEPS.length) * 100}%`
                      }}
                    />
                  </div>
                  <div className="loading-caption">
                    Querying live Google Flights & regional databases...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ================= BOTTOM PROMPT INPUT SECTION ================= */}
          {/* Active only after submitting trip details, otherwise inactive/locked */}
          <div className={`chat-prompt-bar ${!hasSearched ? 'prompt-locked' : 'prompt-active'}`}>
            <form className="prompt-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder={
                  hasSearched
                    ? "Ask follow-ups, refine your itinerary, or explore local tips..."
                    : "Fill and submit your trip details above to start chatting..."
                }
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={isLoading || !hasSearched}
              />
              <button
                type="submit"
                className="prompt-send-btn"
                disabled={isLoading || !hasSearched || !inputText.trim()}
                title={hasSearched ? "Send message" : "Submit trip details first"}
              >
                <Send size={15} />
              </button>
            </form>

            {!hasSearched && (
              <div className="prompt-lock-explanation">
                <span>The prompt bar will unlock after you search flights or generate an itinerary.</span>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT 50% PANEL: VISUAL BANNER & 4-CAPSULE EXPLORER ================= */}
        <div className={`panel-right ${isMobile && mobileActiveTab !== 'explorer' ? 'hidden-mobile' : ''}`}>
          {/* TOP 30-35% HEIGHT: VISUAL HERO BANNER (AUTOSLIDES EVERY 10 SECONDS) */}
          <div className="hero-banner-section">
            <div
              className="hero-banner-image"
              style={{ backgroundImage: `url(${currentBanner.image})` }}
            >
              <div className="hero-banner-overlay" />
              
              {/* Minimalist: Location Name, City, and One-Line Description */}
              <div className="hero-content">
                <h2 className="hero-title">{currentBanner.title}</h2>
                <p className="hero-tagline">{currentBanner.tagline}</p>
              </div>
            </div>
          </div>

          {/* MIDDLE: 4 CAPSULE FILTER BUTTONS */}
          <div className="capsule-navigation-bar">
            <div className="capsule-button-container">
              <button
                type="button"
                className={`capsule-btn ${activeCapsule === 'flights' ? 'active' : ''}`}
                onClick={() => setActiveCapsule('flights')}
              >
                <Plane size={13} />
                <span>Flights</span>
                <span className="capsule-badge">{destinationData.flights?.length || 4}</span>
              </button>

              <button
                type="button"
                className={`capsule-btn ${activeCapsule === 'hotels' ? 'active' : ''}`}
                onClick={() => setActiveCapsule('hotels')}
              >
                <Hotel size={13} />
                <span>Hotels</span>
                <span className="capsule-badge">{destinationData.hotels?.length || 3}</span>
              </button>

              <button
                type="button"
                className={`capsule-btn ${activeCapsule === 'restaurants' ? 'active' : ''}`}
                onClick={() => setActiveCapsule('restaurants')}
              >
                <Utensils size={13} />
                <span>Restaurants</span>
                <span className="capsule-badge">{destinationData.restaurants?.length || 3}</span>
              </button>

              <button
                type="button"
                className={`capsule-btn ${activeCapsule === 'attractions' ? 'active' : ''}`}
                onClick={() => setActiveCapsule('attractions')}
              >
                <Compass size={13} />
                <span>Attractions</span>
                <span className="capsule-badge">{destinationData.attractions?.length || 4}</span>
              </button>
            </div>
          </div>

          {/* BOTTOM 60-65% HEIGHT: CONTENT AREA FOR ACTIVE CAPSULE */}
          <div className="capsule-content-deck">
            {/* 1. FLIGHTS TAB */}
            {activeCapsule === 'flights' && (
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

                <div className="cards-grid">
                  {sortedFlights.map((flight, idx) => (
                    <div
                      key={idx}
                      className="flight-card-compact"
                      onClick={() => setSelectedItemDetail({ type: 'flight', data: flight })}
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
                          <span className="compact-amount">{flight.price.toLocaleString('en-IN')}</span>
                        </div>
                        {(() => {
                          const portals = getFlightBookingPortals(flight);
                          return (
                            <a
                              href={portals.mmt}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="compact-details-btn book-btn"
                              onClick={(e) => e.stopPropagation()}
                              title={`Book on MakeMyTrip (${portals.route} · ${portals.dateFormatted})`}
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
            )}

            {/* 2. HOTELS TAB */}
            {activeCapsule === 'hotels' && (
              <div className="deck-scrollable">
                <div className="deck-header-row">
                  <div className="deck-summary">
                    <h3>Curated Stays & Resorts</h3>
                    <p>{destination ? `Top rated accommodations in ${destination}` : 'Select a destination on the left to see stays'}</p>
                  </div>
                </div>

                <div className="cards-grid">
                  {destinationData.hotels?.map((hotel, idx) => (
                    <div
                      key={idx}
                      className="stay-card-compact"
                      onClick={() => setSelectedItemDetail({ type: 'hotel', data: hotel })}
                    >
                      {/* Left: Name, Category tag, Genuine Rating, Location with Map link */}
                      <div className="compact-hotel-col">
                        <div className="compact-hotel-header">
                          <h4 className="compact-hotel-name">{hotel.name}</h4>
                          {hotel.category && (
                            <span className="compact-category-tag">{hotel.category}</span>
                          )}
                        </div>

                        <div className="compact-hotel-subline">
                          {/* Genuine Rating with review count */}
                          <div className="genuine-rating-badge" title="Verified Guest Rating">
                            <span className="rating-star">★</span>
                            <span className="rating-score">{hotel.rating}</span>
                            {hotel.reviewsCount && (
                              <span className="rating-count">
                                ({hotel.reviewsCount > 999 ? `${(hotel.reviewsCount / 1000).toFixed(1)}k` : hotel.reviewsCount})
                              </span>
                            )}
                          </div>

                          <span className="meta-separator">•</span>

                          {/* Location with direct Google Maps redirect */}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + ' ' + (hotel.location || destination || 'India'))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="compact-map-link"
                            onClick={(e) => e.stopPropagation()}
                            title={`Check ${hotel.name} location on Google Maps`}
                          >
                            <MapPin size={12} className="map-icon" />
                            <span className="map-location-name">{hotel.location}</span>
                            <ExternalLink size={10} className="map-ext" />
                          </a>
                        </div>
                      </div>

                      {/* Right: Price & MakeMyTrip Book Button */}
                      <div className="compact-fare-col">
                        <div className="compact-price">
                          <span className="compact-curr">₹</span>
                          <span className="compact-amount">{hotel.pricePerNight?.toLocaleString('en-IN')}</span>
                          <span className="compact-unit">/ night</span>
                        </div>

                        <a
                          href={`https://www.makemytrip.com/hotels/hotel-listing/?city=${encodeURIComponent(destination || 'India')}&searchText=${encodeURIComponent(hotel.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="compact-details-btn book-btn"
                          onClick={(e) => e.stopPropagation()}
                          title={`Book ${hotel.name} on MakeMyTrip`}
                        >
                          <span>Book</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. RESTAURANTS TAB */}
            {activeCapsule === 'restaurants' && (
              <div className="deck-scrollable">
                <div className="deck-header-row">
                  <div className="deck-summary">
                    <h3>Local Cuisine & Dining</h3>
                    <p>{destination ? `Iconic culinary spots and flavors in ${destination}` : 'Select a destination on the left to view dining'}</p>
                  </div>
                </div>

                <div className="cards-grid">
                  {destinationData.restaurants?.map((rest, idx) => (
                    <div
                      key={idx}
                      className="dining-card-compact"
                      onClick={() => setSelectedItemDetail({ type: 'restaurant', data: rest })}
                    >
                      {/* Left: Name, Cuisine tag, Genuine Rating, Location with Map link */}
                      <div className="compact-hotel-col">
                        <div className="compact-hotel-header">
                          <h4 className="compact-hotel-name">{rest.name}</h4>
                          {rest.cuisine && (
                            <span className="compact-category-tag">{rest.cuisine}</span>
                          )}
                        </div>

                        <div className="compact-hotel-subline">
                          {/* Genuine Rating with review count */}
                          <div className="genuine-rating-badge" title="Verified Customer Rating">
                            <span className="rating-star">★</span>
                            <span className="rating-score">{rest.rating}</span>
                            {rest.reviewsCount && (
                              <span className="rating-count">
                                ({rest.reviewsCount > 999 ? `${(rest.reviewsCount / 1000).toFixed(1)}k` : rest.reviewsCount})
                              </span>
                            )}
                          </div>

                          <span className="meta-separator">•</span>

                          {/* Location with direct Google Maps redirect */}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rest.name + ' ' + (rest.location || destination || 'India'))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="compact-map-link"
                            onClick={(e) => e.stopPropagation()}
                            title={`Check ${rest.name} location on Google Maps`}
                          >
                            <MapPin size={12} className="map-icon" />
                            <span className="map-location-name">{rest.location}</span>
                            <ExternalLink size={10} className="map-ext" />
                          </a>
                        </div>
                      </div>

                      {/* Right: Approx Price for Two & Google Maps Action Button */}
                      <div className="compact-fare-col">
                        <div className="compact-price">
                          <span className="compact-curr">₹</span>
                          <span className="compact-amount">{rest.priceForTwo?.toLocaleString('en-IN')}</span>
                          <span className="compact-unit">for two</span>
                        </div>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rest.name + ' ' + (rest.location || destination || 'India'))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="compact-details-btn book-btn"
                          onClick={(e) => e.stopPropagation()}
                          title={`Open ${rest.name} on Google Maps`}
                        >
                          <span>Map</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. ATTRACTIONS TAB */}
            {activeCapsule === 'attractions' && (
              <div className="deck-scrollable">
                <div className="deck-header-row">
                  <div className="deck-summary">
                    <h3>Must-Visit Attractions</h3>
                    <p>{destination ? `Key landmarks and experiences in ${destination}` : 'Select a destination on the left to explore sights'}</p>
                  </div>
                </div>

                <div className="cards-grid">
                  {destinationData.attractions?.map((att, idx) => (
                    <div
                      key={idx}
                      className="attraction-card-compact"
                      onClick={() => setSelectedItemDetail({ type: 'attraction', data: att })}
                    >
                      {/* Left: Name, Category tag, Location with Map link, Official Timings */}
                      <div className="compact-hotel-col">
                        <div className="compact-hotel-header">
                          <h4 className="compact-hotel-name">{att.name}</h4>
                          {att.category && (
                            <span className="compact-category-tag">{att.category}</span>
                          )}
                        </div>

                        <div className="compact-hotel-subline">
                          {/* Location with direct Google Maps redirect */}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(att.name + ' ' + (att.location || destination || 'India'))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="compact-map-link"
                            onClick={(e) => e.stopPropagation()}
                            title={`Check ${att.name} on Google Maps`}
                          >
                            <MapPin size={12} className="map-icon" />
                            <span className="map-location-name">{att.location || destination || 'India'}</span>
                            <ExternalLink size={10} className="map-ext" />
                          </a>

                          <span className="meta-separator">•</span>

                          {/* Official Visiting Timings */}
                          <div className="compact-timing-badge" title="Official Visiting Hours from Google Maps">
                            <Clock size={11} className="clock-icon" />
                            <span>{att.timings}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Entry Fee / Tariff & Google Maps Directions Button */}
                      <div className="compact-fare-col">
                        <div className="compact-fee-box">
                          <span className="compact-fee-val">{att.entryFee ? att.entryFee.split(' · ')[0] : 'Free Entry'}</span>
                        </div>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(att.name + ' ' + (att.location || destination || 'India'))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="compact-details-btn book-btn"
                          onClick={(e) => e.stopPropagation()}
                          title={`View ${att.name} on Google Maps`}
                        >
                          <span>Map</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* ================= MODAL / POPUP FOR "VIEW DETAILS" ================= */}
      {selectedItemDetail && (
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
                        const portals = getFlightBookingPortals(selectedItemDetail.data);
                        return (
                          <>
                            <a
                              href={portals.mmt}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="portal-btn btn-mmt"
                              title={`Book on MakeMyTrip (${portals.route})`}
                            >
                              <span className="portal-btn-title">Book on MakeMyTrip</span>
                              <span className="portal-btn-sub">{portals.route} · {portals.dateFormatted}</span>
                              <ExternalLink size={13} className="portal-icon" />
                            </a>

                            <a
                              href={portals.airline.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="portal-btn btn-airline"
                              title={`Book directly on ${portals.airline.name}`}
                            >
                              <span className="portal-btn-title">Book on {portals.airline.name}</span>
                              <span className="portal-btn-sub">Direct Airline Portal</span>
                              <ExternalLink size={13} className="portal-icon" />
                            </a>

                            <a
                              href={portals.emt}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="portal-btn btn-emt"
                              title="Book on EaseMyTrip (Zero convenience fee)"
                            >
                              <span className="portal-btn-title">Book on EaseMyTrip</span>
                              <span className="portal-btn-sub">Zero Convenience Fee</span>
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
      )}
    </div>
  );
}
