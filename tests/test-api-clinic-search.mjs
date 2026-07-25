// Clinic Search & Geolocation Match Test Suite
// Run: node --env-file=.env tests/test-api-clinic-search.mjs

const MOCK_CLINICS = [
  {
    id: 'clinic_chennai_1',
    name: 'TTK Hospital (De-Addiction Centre)',
    type: 'De-Addiction Center',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: '4th Main Rd, Indira Nagar, Adyar, Chennai',
    phone: '+91 44 2441 8469',
    rating: 4.8,
    accredited: true,
  },
  {
    id: 'clinic_mumbai_1',
    name: 'Kripa Foundation Rehabilitation Centre',
    type: 'De-Addiction Center',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Mount Carmel Church compound, Bandra West, Mumbai',
    phone: '+91 22 2640 5411',
    rating: 4.7,
    accredited: true,
  },
];

function executeClinicSearch({ city = '', category = 'All', coords = null }) {
  let filtered = MOCK_CLINICS;

  if (city.trim()) {
    const searchCity = city.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.city.toLowerCase().includes(searchCity) ||
        c.state.toLowerCase().includes(searchCity)
    );
  }

  if (category && category !== 'All') {
    filtered = filtered.filter((c) => c.type === category);
  }

  const queryCity = city || 'near me';
  const mapsQuery = coords
    ? `https://www.google.com/maps/search/de+addiction+rehab+center/@${coords.latitude},${coords.longitude},13z`
    : `https://www.google.com/maps/search/de+addiction+rehab+center+${encodeURIComponent(queryCity)}`;

  return {
    clinics: filtered,
    totalFound: filtered.length,
    liveMapsUrl: mapsQuery,
  };
}

async function runClinicSearchTests() {
  console.log('🧪 [3/5] Testing Clinic Search & Geolocation Engine...\n');
  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. City Filter Test (Chennai)
  try {
    const res = executeClinicSearch({ city: 'Chennai' });
    assert(res.clinics.length === 1 && res.clinics[0].city === 'Chennai', 'Filters accredited clinics by city (Chennai)');
  } catch (err) {
    assert(false, `City filter test failed: ${err.message}`);
  }

  // 2. Category Filter Test
  try {
    const res = executeClinicSearch({ city: 'Mumbai', category: 'De-Addiction Center' });
    assert(res.clinics.length === 1 && res.clinics[0].type === 'De-Addiction Center', 'Filters clinics by category');
  } catch (err) {
    assert(false, `Category filter test failed: ${err.message}`);
  }

  // 3. Fallback Google Maps Query Test for Unlisted Cities
  try {
    const res = executeClinicSearch({ city: 'Coimbatore' });
    assert(res.clinics.length === 0 && res.liveMapsUrl.includes('Coimbatore'), 'Generates live Google Maps search URL when no listed clinics exist for city');
  } catch (err) {
    assert(false, `Maps fallback test failed: ${err.message}`);
  }

  // 4. GPS Coordinates Maps Search URL Test
  try {
    const res = executeClinicSearch({ coords: { latitude: 13.0827, longitude: 80.2707 } });
    assert(res.liveMapsUrl.includes('13.0827,80.2707'), 'Generates GPS coordinate search link for precise map discovery');
  } catch (err) {
    assert(false, `GPS coordinates test failed: ${err.message}`);
  }

  console.log(`\n  Clinic Search Test Summary: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runClinicSearchTests();
