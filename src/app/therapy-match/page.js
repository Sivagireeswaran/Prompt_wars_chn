'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './therapy-match.module.css';

export default function TherapyMatchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Search & Location States
  const [cityInput, setCityInput] = useState('');
  const [activeCity, setActiveCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [coords, setCoords] = useState(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [searching, setSearching] = useState(false);

  // Results State
  const [clinics, setClinics] = useState([]);
  const [liveMapsUrl, setLiveMapsUrl] = useState('https://www.google.com/maps/search/addiction+recovery+therapists');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  // Initial load search for default clinics
  useEffect(() => {
    fetchClinics('', 'All');
  }, []);

  async function fetchClinics(city, category) {
    setSearching(true);
    try {
      const res = await fetch('/api/clinic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, category })
      });

      if (!res.ok) throw new Error('Search failed');

      const data = await res.json();
      setClinics(data.clinics || []);
      setLiveMapsUrl(data.liveMapsUrl || `https://www.google.com/maps/search/addiction+recovery+therapists+in+${encodeURIComponent(city || 'India')}`);
      setActiveCity(city);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  }

  function handleSearchSubmit(e) {
    e?.preventDefault();
    fetchClinics(cityInput.trim(), selectedCategory);
  }

  function handleCategorySelect(cat) {
    setSelectedCategory(cat);
    fetchClinics(activeCity || cityInput.trim(), cat);
  }

  // Handle GPS button tap: Extract Lat/Lng and reverse-geocode city name
  function handleUseGPS() {
    setFetchingGps(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setFetchingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setCoords({ latitude, longitude });

        // Build precise coordinate-based Google Maps Search URL
        const coordMapsUrl = `https://www.google.com/maps/search/addiction+recovery+therapist/@${latitude},${longitude},13z`;
        setLiveMapsUrl(coordMapsUrl);

        // Reverse-geocode to detect city name
        try {
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const detectedCity = geoData.city || geoData.locality || geoData.principalSubdivision || '';
            if (detectedCity) {
              setCityInput(detectedCity);
              fetchClinics(detectedCity, selectedCategory);
            } else {
              // Default to live coordinates maps search
              setHasSearched(true);
              setClinics([]);
            }
          }
        } catch {
          // Fallback to coordinates map
          setHasSearched(true);
          setClinics([]);
        } finally {
          setFetchingGps(false);
        }
      },
      (err) => {
        console.warn('GPS location fetch error:', err.message);
        alert('Could not fetch location. Please type your city name manually.');
        setFetchingGps(false);
      },
      { timeout: 10000 }
    );
  }

  if (loading || !user) {
    return (
      <div className="flex flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className={`page-content ${styles.therapyMatch}`}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <h1>📍 Recovery Clinics & Specialist Finder</h1>
          <p>
            Find verified de-addiction institutions, psychiatrists, and licensed recovery centers near you — 100% deterministic & verifiable.
          </p>
        </div>

        {/* Search & Location Bar */}
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Search City or District:
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Mumbai, Delhi, Bengaluru, Indore..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={searching} style={{ minHeight: '48px' }}>
                {searching ? 'Searching...' : '🔍 Search Clinics'}
              </button>
              <button
                type="button"
                onClick={handleUseGPS}
                disabled={fetchingGps}
                className="btn btn-secondary"
                style={{ minHeight: '48px' }}
              >
                {fetchingGps ? 'Locating...' : '📍 Use GPS Location'}
              </button>
            </div>
          </form>

          {/* Category Filter Chips */}
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginRight: '8px' }}>
              Category:
            </span>
            {['All', 'De-addiction Center', 'Addiction Psychiatrists', 'Clinical Psychologists'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--border-radius-full)', fontSize: '0.8rem' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            <h2 style={{ fontSize: '1.4rem' }}>
              {activeCity ? `Clinics near "${activeCity}"` : 'Recommended Verified Recovery Institutions'}
            </h2>
            <a
              href={liveMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.82rem' }}
            >
              🗺️ Open Live Google Maps Search
            </a>
          </div>

          {/* Explicit Graceful Empty State */}
          {hasSearched && clinics.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)', borderStyle: 'dashed' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-sm)' }}>🗺️</span>
              <h3 style={{ marginBottom: '8px' }}>
                No listed seed centers for &quot;{activeCity || cityInput || 'your location'}&quot; yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-lg)', fontSize: '0.95rem' }}>
                We don&apos;t have pre-verified institution partners listed for this specific city yet, but you can view live, rated doctors and de-addiction clinics in your exact neighborhood directly on Google Maps.
              </p>
              <a
                href={liveMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
              >
                🗺️ Search Live Addiction Doctors in {activeCity || cityInput || 'Your Area'} on Google Maps
              </a>
            </div>
          ) : (
            <div className="grid grid-2">
              {clinics.map(clinic => (
                <div key={clinic.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xs)' }}>
                      <span className="badge badge-primary">{clinic.category}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-500)' }}>{clinic.rating}</span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', marginTop: '6px', marginBottom: '6px' }}>{clinic.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      📍 {clinic.address}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--primary-700)', fontWeight: '600', marginBottom: '12px' }}>
                      🛡️ {clinic.accreditation}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                    <a href={`tel:${clinic.phone.replace(/\s+/g, '')}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      📞 Call {clinic.phone}
                    </a>
                    <a href={clinic.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                      📍 Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* National Emergency Support Footer */}
        <section className={styles.helplineSection}>
          <h2>📞 24/7 National Emergency Help Lines</h2>
          <div className="grid grid-2" style={{ marginTop: 'var(--space-md)' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
              <h3>Tele MANAS (India Mental Health)</h3>
              <p style={{ fontSize: '0.85rem', margin: '4px 0 10px' }}>
                Toll-free national crisis helpline available 24/7 in 22 regional languages.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <a href="tel:14416" className="btn btn-primary btn-sm">📞 Call 14416</a>
                <a href="tel:18008914416" className="btn btn-secondary btn-sm">📞 1800-89-14416</a>
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <h3>988 Crisis & Veterans Line</h3>
              <p style={{ fontSize: '0.85rem', margin: '4px 0 10px' }}>
                Free, confidential crisis counseling. Hearing loss TTY via 711. Veterans press 1 or text 838255.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <a href="tel:988" className="btn btn-danger btn-sm">📞 Call or Text 988</a>
                <a href="https://988lifeline.org/chat" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">💬 Online Chat</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
