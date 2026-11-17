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
  Check,
  MessageSquare,
  Folder,
  Landmark,
  Minus,
  Plus
} from 'lucide-react';

import { DEFAULT_INDIA_BANNERS, getDestinationData, getCityHeroImage, fetchWikipediaImage } from './destinationData';

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

  const banners = destination ? (deckData.banners?.length ? deckData.banners : DEFAULT_INDIA_BANNERS) : DEFAULT_INDIA_BANNERS;

  // Helper to extract AI suggested places, hotels, or restaurants from chat response
  const extractSuggestionsFromReply = (replyText, userQuery, currentCity) => {
    if (!replyText) return { category: null, items: [] };

    const qLower = (userQuery || '').toLowerCase();
    const rLower = replyText.toLowerCase();

    // Determine target category
    let category = null;
    if (/hotel|stay|resort|lodge|villa|hostel|inn/i.test(qLower) || (/hotel|stay|resort/i.test(rLower) && !/restaurant|cafe/i.test(qLower))) {
      category = 'hotels';
    } else if (/restaurant|food|dine|dining|eat|dish|cafe|shack|bakery|thali/i.test(qLower) || /restaurant|cuisine|dining/i.test(rLower)) {
      category = 'restaurants';
    } else if (/place|spot|sight|attraction|visit|see|landmark|monument|fort|beach|temple|lake/i.test(qLower) || /attraction|sight|monument/i.test(rLower)) {
      category = 'attractions';
    }

    // Match numbered or bulleted items with bold titles: e.g. "1. **Chapora Fort** - description"
    const itemRegex = /(?:^|\n)\s*(?:[0-9]+[.)]|\*|-)\s*(?:\*\*(.*?)\*\*|([A-Z][a-zA-Z0-9\s'&-]{2,35}))[:\s–—-]+([^\n]+)/g;
    const items = [];
    let match;

    while ((match = itemRegex.exec(replyText)) !== null) {
      const rawTitle = (match[1] || match[2] || '').trim();
      const rawDesc = (match[3] || '').trim();

      if (!rawTitle || rawTitle.length < 3 || /day \d|itinerary|overview|summary|step \d|tip \d|budget/i.test(rawTitle)) {
        continue;
      }

      if (category === 'attractions' || !category) {
        items.push({
          name: rawTitle,
          category: 'AI Recommendation',
          location: currentCity || 'Local Area',
          timings: 'Check on Google Maps',
          entryFee: 'Free Entry / Variable',
          highlights: rawDesc || 'Recommended sightseeing and exploration spot.'
        });
      } else if (category === 'hotels') {
        items.push({
          name: rawTitle,
          category: 'Recommended Stay',
          location: currentCity || 'Central Area',
          rating: 4.7,
          reviewsCount: 1250,
          pricePerNight: 5500,
          description: rawDesc || 'Comfortable recommended accommodation.'
        });
      } else if (category === 'restaurants') {
        items.push({
          name: rawTitle,
          cuisine: 'Specialty Dining',
          location: currentCity || 'City Center',
          rating: 4.6,
          reviewsCount: 1600,
          priceForTwo: 1400,
          ambience: rawDesc || 'Authentic dining destination.'
        });
      }
    }

    return { category: category || (items.length > 0 ? 'attractions' : null), items };
  };

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

      // Format clean Places to visit message matching reference Image 4!
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

      // Automatically focus on flight results tab in explorer
      setActiveCapsule('flights');
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
    if (isMobile) setMobileActiveTab('chat');

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
      let updatedDest = destination;
      for (const c of FALLBACK_CITIES) {
        const cName = c.split(' (')[0];
        const regex = new RegExp(`\\b${cName.toLowerCase()}\\b`, 'i');
        if (regex.test(lowerQuery)) {
          updatedDest = cName;
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
    setIsLoading(false);
    setLoadingStepIndex(0);
    setActiveCapsule('flights');
    setBannerIndex(0);
    setSelectedItemDetail(null);
    setDeckData(getDestinationData(''));
  };

  const handlePrint = () => {
    setIsMenuOpen(false);
    window.print();
  };

  // Sort flights based on active sort pill
  // Sort flights based on active sort pill
  const sortFlightList = (list) => {
    return [...(list || [])].sort((a, b) => {
      if (flightSort === 'cheapest') return (a.price || 0) - (b.price || 0);
      if (flightSort === 'fastest') return (a.duration || '').localeCompare(b.duration || '');
      return 0; // recommended
    });
  };

  const sortedOutbound = sortFlightList(deckData.outbound_flights || deckData.flights || []);
  const sortedReturn = sortFlightList(deckData.return_flights || []);
  const sortedFlights = sortedOutbound;

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
  const getFlightBookingPortals = (flight, isReturn = false) => {
    const flightOrig = flight?.origin || (isReturn ? destination : origin);
    const flightDest = flight?.destination || (isReturn ? origin : destination);
    const origIata = resolveIATA(flightOrig, isReturn ? 'PAT' : 'DEL');
    const destIata = resolveIATA(flightDest, isReturn ? 'DEL' : 'PAT');
    const dDate = flight?.date || (isReturn ? (returnDate || departureDate) : (departureDate || formatDate(new Date())));
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

  const currentDefaultBanner = DEFAULT_INDIA_BANNERS[bannerIndex % DEFAULT_INDIA_BANNERS.length] || DEFAULT_INDIA_BANNERS[0];
  const activeHeroImage = destination
    ? (customDestImage || getCityHeroImage(destination) || currentDefaultBanner.image)
    : currentDefaultBanner.image;
  const activeHeroTitle = destination
    ? destination
    : (currentDefaultBanner?.title?.includes(',') ? currentDefaultBanner.title.split(',')[1].trim() : (currentDefaultBanner?.title || 'India'));

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

          {/* Navigation Links */}
          <nav className="sidebar-nav-links">
            <button
              type="button"
              className="sidebar-nav-item active"
              onClick={() => {
                if (isMobile) setMobileActiveTab('chat');
              }}
            >
              <Sparkles size={16} />
              <span>AI Trip Planner</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Theme Toggle & Domestic India */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-theme-toggle-btn"
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
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
              <div className="message-row assistant intro-row">
                {/* BOT GREETING SPEECH BUBBLE */}
                <div className="bot-welcome-row">
                  <div className="avatar-bot-round">
                    <Bot size={22} />
                  </div>
                  <div className="bot-speech-bubble">
                    <div className="bubble-heading">Hi!</div>
                    <div className="bubble-text">I'm your travel assistant.</div>
                    <div className="bubble-text">Where would you like to go?</div>
                  </div>
                </div>

                <p className="bot-prompt-lead">
                  Great! I can help plan your trip. Fill in the details below to get started.
                </p>

                {/* TRIP INPUT FORM CARD EMBEDDED IN CHAT */}
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
                  <div className="message-bubble-wrapper">
                    <div className="message-bubble markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {(msg.content || '').replace(/<br\s*\/?>/gi, '\n\n')}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* SIMPLE LOADING IN CHAT */}
            {isLoading && (
              <div className="message-row assistant">
                <div className="avatar-bot">
                  <Bot size={16} />
                </div>
                <div className="message-bubble-wrapper">
                  <div className="message-bubble loading">
                    <span>Thinking…</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ================= BOTTOM PROMPT INPUT SECTION ================= */}
          <div className="chat-prompt-bar clean-bar">
            <form className="clean-prompt-form" onSubmit={handleSendMessage}>
              <div className="clean-input-inner">
                <Sparkles size={16} className="clean-sparkle-icon" />
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="clean-circle-send"
                  disabled={isLoading || !inputText.trim()}
                  title="Send message"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ================= RIGHT 50% PANEL: VISUAL BANNER & 4-CAPSULE EXPLORER ================= */}
        <div className={`panel-right ${isMobile && mobileActiveTab !== 'explorer' ? 'hidden-mobile' : ''}`}>
          {/* TOP: VISUAL HERO BANNER */}
          <div className="hero-banner-section">
            <div
              className="hero-banner-image"
              style={{ backgroundImage: `url(${activeHeroImage})` }}
            >
              <div className="hero-banner-overlay" />
              
              <div className="hero-content">
                <span className="hero-eyebrow">Explore India</span>
                <h2 className="hero-title">{activeHeroTitle}</h2>
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

          {/* BOTTOM DECK: When planning trip, show clean Checking travel options state! */}
          {isPlanningTrip ? (
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
          ) : !hasSearched ? (
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
          ) : (
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

                {(deckData.trip_type === 'round_trip' || tripType === 'round_trip') && sortedReturn.length > 0 ? (
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
                            onClick={() => setSelectedItemDetail({ type: 'flight', data: flight })}
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
                                const portals = getFlightBookingPortals(flight, false);
                                return (
                                  <a
                                    href={portals.mmt}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="compact-details-btn book-btn"
                                    onClick={(e) => e.stopPropagation()}
                                    title={`Book Outbound on MakeMyTrip (${portals.route} · ${portals.dateFormatted})`}
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
                            onClick={() => setSelectedItemDetail({ type: 'flight', data: flight })}
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
                                const portals = getFlightBookingPortals(flight, true);
                                return (
                                  <a
                                    href={portals.mmt}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="compact-details-btn book-btn"
                                    onClick={(e) => e.stopPropagation()}
                                    title={`Book Return on MakeMyTrip (${portals.route} · ${portals.dateFormatted})`}
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
                            <span className="compact-amount">{(flight.price || 0).toLocaleString('en-IN')}</span>
                          </div>
                          {(() => {
                            const portals = getFlightBookingPortals(flight, false);
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
                )}
              </div>
            )}

            {/* 2. HOTELS TAB */}
            {activeCapsule === 'hotels' && (
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
                      onClick={() => setSelectedItemDetail({ type: 'hotel', data: hotel })}
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
            )}

            {/* 3. RESTAURANTS TAB */}
            {activeCapsule === 'restaurants' && (
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
            )}

            {/* 4. ATTRACTIONS TAB (PLACES TO VISIT) */}
            {activeCapsule === 'attractions' && (
              <div className="deck-scrollable">
                <div className="deck-header-row">
                  <div className="deck-summary">
                    <h3>Places to Visit</h3>
                  </div>
                </div>

                <div className="stays-horizontal-list">
                  {deckData.attractions?.slice(0, 7).map((att, idx) => (
                    <article key={idx} className="stay-card-horizontal attraction-card-horizontal">
                      <div className="stay-info-col">
                        <h4 className="stay-property-name">{att.name}</h4>
                        <p className="stay-card-address">{att.address || `${att.name}, ${destination || 'City Center'}, India`}</p>
                      </div>

                      <div className="stay-card-actions attraction-actions">
                        <a
                          href={att.maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(att.name + ' ' + (att.address || destination || 'India'))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="stay-action-btn primary"
                          title={`Open ${att.name} on Google Maps`}
                        >
                          <span>Open Maps</span>
                          <span className="btn-arrow">↗</span>
                        </a>

                        <button
                          type="button"
                          className="stay-action-btn primary ask-about-btn"
                          disabled={isLoading}
                          onClick={() => handleAskAboutPlace(att)}
                          title={`Ask the travel assistant about ${att.name}`}
                        >
                          <span>Ask about this place</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="provider-disclaimer">
                  Verify prices and availability with the provider before booking.
                </div>
              </div>
            )}
          </div>
        )}
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
