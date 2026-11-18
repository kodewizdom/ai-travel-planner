// Indian Airport IATA Code Mapping
export const IATA_MAP = {
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

export const resolveIATA = (val, fallback = 'DEL') => {
  if (!val) return fallback;
  const str = String(val).trim();
  if (/^[A-Z]{3}$/.test(str)) return str;
  const match = str.match(/\(([A-Z]{3})\)/);
  if (match) return match[1];
  const clean = str.toLowerCase().split(' (')[0].split(',')[0].trim();
  return IATA_MAP[clean] || fallback;
};

export const formatPortalDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Generate authentic direct official airline booking portal links
export const getFlightBookingPortals = (flight, isReturn = false, context = {}) => {
  const origin = context.origin || '';
  const destination = context.destination || '';
  const departureDate = context.departureDate || '';
  const returnDate = context.returnDate || '';

  const flightOrig = flight?.origin || (isReturn ? destination : origin);
  const flightDest = flight?.destination || (isReturn ? origin : destination);
  const origIata = resolveIATA(flightOrig, isReturn ? 'PAT' : 'DEL');
  const destIata = resolveIATA(flightDest, isReturn ? 'DEL' : 'PAT');
  const dDate = flight?.date || (isReturn ? (returnDate || departureDate) : (departureDate || formatDate(new Date())));
  const ddmmyyyy = formatPortalDate(dDate);

  const airlineName = flight?.airline_name || flight?.airline || 'Airline';
  const airlineLower = airlineName.toLowerCase();
  const flightNo = (flight?.flightNo || flight?.flight_number || '').toUpperCase().trim();

  let airlineUrl = flight?.airline_url || flight?.booking_link;
  let airlineLabel = `${airlineName} Official`;

  if (flightNo.startsWith('6E') || airlineLower.includes('indigo')) {
    airlineUrl = 'https://www.goindigo.in/';
    airlineLabel = 'IndiGo Official';
  } else if (flightNo.startsWith('IX') || airlineLower.includes('air india express') || (airlineLower.includes('express') && airlineLower.includes('air'))) {
    airlineUrl = 'https://www.airindiaexpress.com/';
    airlineLabel = 'Air India Express';
  } else if (flightNo.startsWith('AI') || airlineLower.includes('air india')) {
    airlineUrl = 'https://www.airindia.com/';
    airlineLabel = 'Air India Official';
  } else if (flightNo.startsWith('QP') || airlineLower.includes('akasa')) {
    airlineUrl = 'https://www.akasaair.com/';
    airlineLabel = 'Akasa Air Official';
  } else if (flightNo.startsWith('SG') || airlineLower.includes('spicejet') || airlineLower.includes('spice')) {
    airlineUrl = 'https://www.spicejet.com/';
    airlineLabel = 'SpiceJet Official';
  } else if (flightNo.startsWith('UK') || airlineLower.includes('vistara')) {
    airlineUrl = 'https://www.airindia.com/';
    airlineLabel = 'Air India (Vistara)';
  } else if (flightNo.startsWith('9I') || airlineLower.includes('alliance')) {
    airlineUrl = 'https://allianceair.in/';
    airlineLabel = 'Alliance Air';
  } else if (flightNo.startsWith('S9') || airlineLower.includes('flybig')) {
    airlineUrl = 'https://flybig.in/';
    airlineLabel = 'FlyBig';
  } else if (flightNo.startsWith('S5') || airlineLower.includes('star air')) {
    airlineUrl = 'https://starair.in/';
    airlineLabel = 'Star Air';
  } else if (!airlineUrl) {
    airlineUrl = 'https://www.goindigo.in/';
    airlineLabel = 'Airline Official Portal';
  }

  const gFlightsUrl = `https://www.google.com/travel/flights?q=flights+from+${origIata}+to+${destIata}+on+${dDate}`;

  return {
    directUrl: airlineUrl,
    airline: { name: airlineLabel, url: airlineUrl },
    googleFlights: gFlightsUrl,
    route: `${origIata} → ${destIata}`,
    dateFormatted: ddmmyyyy
  };
};

export const sortFlightList = (list, sortType = 'recommended') => {
  return [...(list || [])].sort((a, b) => {
    if (sortType === 'cheapest') return (a.price || 0) - (b.price || 0);
    if (sortType === 'fastest') return (a.duration || '').localeCompare(b.duration || '');
    return 0; // recommended
  });
};
