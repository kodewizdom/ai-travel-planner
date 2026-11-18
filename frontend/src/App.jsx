import React, { useState, useEffect, useRef } from 'react';
import { Bot, Compass } from 'lucide-react';

import { DEFAULT_INDIA_BANNERS, getDestinationData, getCityHeroImage, fetchWikipediaImage } from './destinationData';
import { formatDate, sortFlightList } from './utils/flightUtils';

import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import HeroBanner from './components/HeroBanner';
import CapsuleNav from './components/CapsuleNav';
import InitialDeckCard from './components/InitialDeckCard';
import FlightDeck from './components/FlightDeck';
import HotelDeck from './components/HotelDeck';
import RestaurantDeck from './components/RestaurantDeck';
import AttractionDeck from './components/AttractionDeck';
import DetailModal from './components/DetailModal';

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
  const [isPlanningTrip, setIsPlanningTrip] = useState(false);
  const [customDestImage, setCustomDestImage] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const isLoading = isPlanningTrip || isChatLoading;
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // App Theme: defaults to light to match modern aesthetic
  const [theme, setTheme] = useState(() => localStorage.getItem('travel_planner_theme') || 'light');
  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Mobile & Tablet Tab View State ("planner" or "itinerary")
  const [mobileActiveTab, setMobileActiveTab] = useState('planner');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  // Right Section State
  const [activeCapsule, setActiveCapsule] = useState('flights');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [flightSort, setFlightSort] = useState('recommended');

  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);

  const hasSearched = messages.some(m => m.role === 'assistant');

  // Load destination details reactively in deckData state so suggestions can update it dynamically
  const [deckData, setDeckData] = useState(() => getDestinationData(destination));

  useEffect(() => {
    const base = getDestinationData(destination);
    if (!destination) {
      setDeckData(base);
      return;
    }

    setDeckData(base);

    // 1. Fetch 12 live hotels for the destination
    fetch('/api/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination,
        check_in_date: departureDate,
        check_out_date: returnDate,
        adults: travellers,
        rooms: 1
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.hotels && data.hotels.length > 0) {
          setDeckData(prev => ({
            ...prev,
            hotels: data.hotels
          }));
        }
      })
      .catch(() => {});

    // 2. Fetch authentic local restaurants for the destination
    fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination,
        limit: 12
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.restaurants && data.restaurants.length > 0) {
          setDeckData(prev => ({
            ...prev,
            restaurants: data.restaurants
          }));
        }
      })
      .catch(() => {});

    // 3. Fetch top sights and places to visit for the destination (max 7)
    fetch('/api/attractions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination,
        limit: 7
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.attractions && data.attractions.length > 0) {
          setDeckData(prev => ({
            ...prev,
            attractions: data.attractions.slice(0, 7)
          }));
        }
      })
      .catch(() => {});
  }, [destination]);

  // Lookup authentic destination photo whenever destination changes
  useEffect(() => {
    if (!destination) {
      setCustomDestImage(null);
      return;
    }
    const known = getCityHeroImage(destination);
    if (known) {
      setCustomDestImage(known);
    } else {
      let cancelled = false;
      fetchWikipediaImage(destination).then(url => {
        if (!cancelled && url) {
          setCustomDestImage(url);
        }
      });
      return () => { cancelled = true; };
    }
  }, [destination]);

  // Auto-rotate Hero Banner every 7 seconds ONLY when exploring (no destination selected)
  useEffect(() => {
    if (destination) return;
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % DEFAULT_INDIA_BANNERS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [destination]);

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

    setIsPlanningTrip(true);

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

      setDeckData(prev => ({
        ...prev,
        flights: data.outbound_flights || data.flights || prev.flights,
        outbound_flights: data.outbound_flights || data.flights || prev.outbound_flights,
        return_flights: data.return_flights || prev.return_flights || [],
        trip_type: data.trip_type || tripType,
        departure_date: data.departure_date || departureDate,
        return_date: data.return_date || returnDate,
        hotels: (data.hotels && data.hotels.length > 0) ? data.hotels : prev.hotels,
        restaurants: (data.restaurants && data.restaurants.length > 0) ? data.restaurants : prev.restaurants,
        attractions: ((data.attractions && data.attractions.length > 0) ? data.attractions : (prev.attractions || [])).slice(0, 7)
      }));

      // Format clean Places to visit message matching reference!
      const placesList = (data.attractions && data.attractions.length > 0)
        ? data.attractions
        : (deckData.attractions || []);

      const placesReplyText = placesList && placesList.length > 0
        ? ["Places to visit\n", ...placesList.slice(0, 4).map(p => `• ${p.name}\n`)].join("\n")
        : "Places to visit\n\nNo places to visit were returned for this trip. You can ask me to search again.";

      setMessages(prev => [
        ...prev,
        { role: 'user', content: data.prompt, isInternal: true, summary: summaryText },
        {
          role: 'assistant',
          content: placesReplyText,
          isPlanResult: false,
          destName: destination
        }
      ]);

      // Automatically focus on flight results tab and switch to Itinerary on mobile/tablet
      setActiveCapsule('flights');
      if (isMobile) {
        setMobileActiveTab('itinerary');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsPlanningTrip(false);
    }
  };

  const handleSendMessage = async (e, customText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const text = (customText !== null ? customText : inputText).trim();
    if (!text || isLoading) return;

    if (customText === null) {
      setInputText('');
    }
    const newMessages = [...messages, { role: 'user', content: text, isInternal: false }];
    setMessages(newMessages);
    setIsChatLoading(true);
    if (isMobile) setMobileActiveTab('planner');

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

      // 1. Check if user or reply mentioned a new destination city
      const lowerQuery = text.toLowerCase();
      for (const c of FALLBACK_CITIES) {
        const cName = c.split(' (')[0];
        const regex = new RegExp(`\\b${cName.toLowerCase()}\\b`, 'i');
        if (regex.test(lowerQuery)) {
          setDestination(cName);
          break;
        }
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          isInternal: false
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an issue: ${err.message}`,
          isInternal: false
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAskAboutPlace = (place) => {
    const question = `What should I know before visiting ${place.name}${destination ? ` in ${destination}` : ''}?`;
    handleSendMessage(null, question);
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
    setDeckData(getDestinationData(''));
    setActiveCapsule('flights');
    setBannerIndex(0);
    setSelectedItemDetail(null);
  };

  const sortedOutbound = sortFlightList(deckData.outbound_flights || deckData.flights || [], flightSort);
  const sortedReturn = sortFlightList(deckData.return_flights || [], flightSort);
  const sortedFlights = sortedOutbound;

  const currentDefaultBanner = DEFAULT_INDIA_BANNERS[bannerIndex % DEFAULT_INDIA_BANNERS.length] || DEFAULT_INDIA_BANNERS[0];
  const activeHeroImage = destination
    ? (customDestImage || getCityHeroImage(destination) || currentDefaultBanner.image)
    : currentDefaultBanner.image;
  const activeHeroTitle = destination
    ? destination
    : (currentDefaultBanner?.title?.includes(',') ? currentDefaultBanner.title.split(',')[1].trim() : (currentDefaultBanner?.title || 'India'));

  const tripFormProps = {
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
    today
  };

  return (
    <div className="app-viewport">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onSelectPlanner={() => {
          if (isMobile) setMobileActiveTab('planner');
        }}
      />

      {/* Main Workspace Area */}
      <div className="app-main-workspace">
        {/* Mobile & Tablet Top View Switcher */}
        {isMobile && (
          <div className="mobile-tab-bar">
            <button
              type="button"
              className={`mobile-tab-btn ${mobileActiveTab === 'planner' ? 'active' : ''}`}
              onClick={() => setMobileActiveTab('planner')}
            >
              <Sparkles size={15} />
              <span>Trip Planner</span>
            </button>
            <button
              type="button"
              className={`mobile-tab-btn ${mobileActiveTab === 'itinerary' ? 'active' : ''}`}
              onClick={() => setMobileActiveTab('itinerary')}
            >
              <Compass size={15} />
              <span>Live Itinerary</span>
              {hasSearched && (
                <span className="mobile-tab-badge">Ready</span>
              )}
            </button>
          </div>
        )}

        <div className="layout-split-container">
          {/* ================= LEFT PANEL: CHATBOT & EMBEDDED TRIP FORM ================= */}
          <ChatPanel
            isMobile={isMobile}
            mobileActiveTab={mobileActiveTab}
            chatScrollRef={chatScrollRef}
            messagesEndRef={messagesEndRef}
            messages={messages}
            isLoading={isLoading}
            inputText={inputText}
            setInputText={setInputText}
            handleSendMessage={handleSendMessage}
            tripFormProps={tripFormProps}
            hasSearched={hasSearched}
            onViewItinerary={() => setMobileActiveTab('itinerary')}
          />

          {/* ================= RIGHT PANEL: VISUAL BANNER & 4-CAPSULE EXPLORER ================= */}
          <div className={`panel-right ${isMobile && mobileActiveTab !== 'itinerary' ? 'hidden-mobile' : ''}`}>
            {/* TOP: VISUAL HERO BANNER */}
            <HeroBanner
              activeHeroImage={activeHeroImage}
              activeHeroTitle={activeHeroTitle}
            />

            {/* MIDDLE: 4 CAPSULE FILTER BUTTONS */}
            <CapsuleNav
              activeCapsule={activeCapsule}
              setActiveCapsule={setActiveCapsule}
            />

            {/* BOTTOM DECK: When planning trip, show clean Checking travel options state! */}
            {isPlanningTrip || !hasSearched ? (
              <InitialDeckCard
                activeCapsule={activeCapsule}
                isPlanningTrip={isPlanningTrip}
              />
            ) : (
              <div className="capsule-content-deck">
                {/* 1. FLIGHTS TAB */}
                {activeCapsule === 'flights' && (
                  <FlightDeck
                    deckData={deckData}
                    origin={origin}
                    destination={destination}
                    departureDate={departureDate}
                    returnDate={returnDate}
                    tripType={tripType}
                    flightSort={flightSort}
                    setFlightSort={setFlightSort}
                    sortedOutbound={sortedOutbound}
                    sortedReturn={sortedReturn}
                    sortedFlights={sortedFlights}
                    onSelectFlight={(flight) => setSelectedItemDetail({ type: 'flight', data: flight })}
                  />
                )}

                {/* 2. HOTELS TAB */}
                {activeCapsule === 'hotels' && (
                  <HotelDeck
                    deckData={deckData}
                    destination={destination}
                    onSelectHotel={(hotel) => setSelectedItemDetail({ type: 'hotel', data: hotel })}
                  />
                )}

                {/* 3. RESTAURANTS TAB */}
                {activeCapsule === 'restaurants' && (
                  <RestaurantDeck
                    deckData={deckData}
                    destination={destination}
                  />
                )}

                {/* 4. ATTRACTIONS TAB (PLACES TO VISIT) */}
                {activeCapsule === 'attractions' && (
                  <AttractionDeck
                    deckData={deckData}
                    destination={destination}
                    isLoading={isLoading}
                    handleAskAboutPlace={handleAskAboutPlace}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODAL / POPUP FOR "VIEW DETAILS" ================= */}
      <DetailModal
        selectedItemDetail={selectedItemDetail}
        setSelectedItemDetail={setSelectedItemDetail}
        origin={origin}
        destination={destination}
        departureDate={departureDate}
        returnDate={returnDate}
        setInputText={setInputText}
        isMobile={isMobile}
        setMobileActiveTab={setMobileActiveTab}
      />
    </div>
  );
}
