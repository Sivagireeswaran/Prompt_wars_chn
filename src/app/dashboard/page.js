'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { updateEmergencyContacts } from '@/lib/firebase';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [coords, setCoords] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Emergency Contacts & SMS states
  const [contacts, setContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [smsModalContact, setSmsModalContact] = useState(null);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [contactSaveError, setContactSaveError] = useState('');

  // Sync local contacts list whenever profile loads or user changes (Account-wise)
  useEffect(() => {
    if (!user) return;
    const storageKey = `recovrai_contacts_${user.uid}`;

    if (profile?.emergencyContacts && Array.isArray(profile.emergencyContacts)) {
      setContacts(profile.emergencyContacts);
      try {
        localStorage.setItem(storageKey, JSON.stringify(profile.emergencyContacts));
      } catch (e) {}
    } else {
      // Fallback to account-keyed local cache if Firestore read returned empty/null
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setContacts(parsed);
        } else {
          setContacts([]);
        }
      } catch (e) {
        setContacts([]);
      }
    }
  }, [profile, user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  function handleFetchLocation(callback) {
    setFetchingLocation(true);
    setLocationError('');
    setCopySuccess(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setFetchingLocation(false);
      if (callback) callback(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoords(newCoords);
        setFetchingLocation(false);
        if (callback) callback(newCoords);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setLocationError('Permission denied or location unavailable.');
        setFetchingLocation(false);
        if (callback) callback(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleCopyLocationLink() {
    if (!coords) return;
    const url = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  }

  async function handleAddContact(e) {
    e.preventDefault();
    const name = newContactName.trim();
    const phone = newContactPhone.trim();
    if (!name || !phone || !user) return;

    const updated = [...contacts, { name, phone }];
    setContacts(updated); // optimistic update — list shows instantly
    setNewContactName('');
    setNewContactPhone('');
    setContactSaveError('');

    // Save to account-specific local storage immediately
    try {
      localStorage.setItem(`recovrai_contacts_${user.uid}`, JSON.stringify(updated));
    } catch (err) {}

    // Persist to Firestore
    const ok = await updateEmergencyContacts(user.uid, updated);
    if (!ok) {
      console.warn('Firestore sync failed, retained in local storage for account');
    }
  }

  async function handleRemoveContact(index) {
    if (!user) return;
    const updated = contacts.filter((_, i) => i !== index);
    setContacts(updated);

    try {
      localStorage.setItem(`recovrai_contacts_${user.uid}`, JSON.stringify(updated));
    } catch (err) {}

    await updateEmergencyContacts(user.uid, updated);
  }

  async function handleTriggerSMSAlert(contact) {
    setSendingAlert(true);
    // Explicitly grab location at the moment of trigger
    handleFetchLocation((fetchedCoords) => {
      const mapsUrl = fetchedCoords 
        ? `\n📍 Current Location: https://www.google.com/maps?q=${fetchedCoords.latitude},${fetchedCoords.longitude}`
        : '';
      
      const messageText = `Emergency Alert from RecovrAI: I need support. Please contact me.${mapsUrl}`;
      
      // Check if mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Launch native SMS protocol
        window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(messageText)}`;
      } else {
        // Launch desktop copy preview modal
        setSmsModalContact({
          name: contact.name,
          phone: contact.phone,
          text: messageText
        });
      }
      setSendingAlert(false);
    });
  }

  if (loading || !user) {
    return (
      <div className="flex flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const displayName = profile?.displayName || user.email?.split('@')[0] || 'Friend';

  const quickActions = [
    {
      href: '/companion',
      icon: '💬',
      title: 'AI Companion',
      description: 'Talk to your recovery companion using voice or text',
      color: 'var(--primary-500)',
    },
    {
      href: '/education',
      icon: '📚',
      title: 'Learn & Grow',
      description: 'Explore AI-generated educational resources',
      color: 'var(--accent-400)',
    },
    {
      href: '/therapy-match',
      icon: '📍',
      title: 'Find Clinics',
      description: 'Accredited de-addiction centers & specialists near you',
      color: 'var(--info)',
    },
  ];

  return (
    <div className={`page-content ${styles.dashboard}`}>
      <div className="container">
        {/* Welcome Section */}
        <section className={`${styles.welcome} animate-fade-in`}>
          <div>
            <p className={styles.greetingLabel}>{greeting}</p>
            <h1 className={styles.greetingName}>{displayName} 💚</h1>
            <p className={styles.greetingSub}>
              You&apos;re doing great by showing up today. How can I help?
            </p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className={styles.actions}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={`grid grid-2 stagger`}>
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`card ${styles.actionCard} animate-fade-in-up`}
                id={`action-${action.title.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div
                  className={styles.actionIcon}
                  style={{ background: `${action.color}15` }}
                >
                  {action.icon}
                </div>
                <div>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
                <span className={styles.actionArrow}>→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Emergency Contacts Panel */}
        <section className={styles.actions} style={{ marginTop: 'var(--space-xl)' }}>
          <div className="card">
            <h2 className={styles.sectionTitle} style={{ marginBottom: 'var(--space-md)' }}>👥 Emergency Supporters & SMS Alerts</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
              Add family members, caregivers, or friends. Click <strong>Send SMS</strong> in an emergency to open a pre-filled text with your current coordinates (mobile) or copy the text (desktop).
            </p>

            {/* List of Contacts */}
            <div className={styles.contactsList} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              {contacts.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No contacts added yet. Use the form below to add your supporters.
                </p>
              ) : (
                contacts.map((contact, index) => (
                  <div 
                    key={index} 
                    className={styles.contactItem}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{contact.name}</strong>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{contact.phone}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      <button
                        type="button"
                        onClick={() => handleTriggerSMSAlert(contact)}
                        disabled={sendingAlert}
                        className="btn btn-primary btn-sm"
                        style={{ minHeight: '32px', fontSize: '0.8rem' }}
                      >
                        📍 {sendingAlert ? 'Tagging...' : 'Send SMS'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(index)}
                        className="btn btn-ghost btn-sm"
                        style={{ minHeight: '32px', fontSize: '0.8rem', color: 'var(--danger)' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Contact Form */}
            <form onSubmit={handleAddContact} style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)' }}>
              <input
                type="text"
                placeholder="Supporter's Name"
                className="input"
                style={{ flex: 1, minWidth: '150px' }}
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number (e.g. +91...)"
                className="input"
                style={{ flex: 1, minWidth: '150px' }}
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ minHeight: '40px' }}>
                ＋ Add Supporter
              </button>
            </form>
            {contactSaveError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: 'var(--space-sm)' }}>
                {contactSaveError}
              </p>
            )}
          </div>
        </section>

        {/* Daily Affirmation */}
        <section className={`${styles.affirmation} animate-fade-in-up`}>
          <div className={`card card-glass ${styles.affirmationCard}`}>
            <span className={styles.affirmationIcon}>🌱</span>
            <blockquote className={styles.affirmationText}>
              &ldquo;Recovery is not a race. You don&apos;t have to feel guilty if it
              takes you longer than you thought it would.&rdquo;
            </blockquote>
            <p className={styles.affirmationNote}>
              Remember: Every moment of choosing recovery is a victory.
            </p>
          </div>
        </section>

        {/* Crisis banner */}
        <section className={styles.crisis}>
          <div className={`card ${styles.crisisCard}`}>
            <div className={styles.crisisContent}>
              <div>
                <h3>Need immediate help?</h3>
                <p>
                  Call or text <strong>988</strong> — Suicide & Crisis Lifeline.
                  Available 24/7.
                </p>
              </div>
              <a href="tel:988" className="btn btn-danger" aria-label="Call 988">
                📞 Call 988
              </a>
            </div>
          </div>
        </section>

        {/* India Helpline banner */}
        <section className={styles.crisis} style={{ marginTop: 'var(--space-md)' }}>
          <div className={`card ${styles.crisisCard}`} style={{ borderLeftColor: 'var(--primary-500)' }}>
            <div className={styles.crisisContent}>
              <div>
                <h3>Speak with someone today (India Help)</h3>
                <p style={{ fontWeight: 'bold', color: 'var(--primary-600)', marginBottom: '4px' }}>
                  Tele MANAS — Mental Health Assistance and Nationally Actionable Science
                </p>
                <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                  <strong>Languages:</strong> English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Bengali, Assamese, Bodo, Dogri, Kashmiri, Konkani, Maithili, Manipuri, Nepali, Odia, Santali, Sindhi, Urdu.
                </p>
                <p style={{ fontSize: '0.85rem' }}>
                  Available 24/7. Toll-free.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <a href="tel:14416" className="btn btn-primary" aria-label="Call Tele MANAS 14416">
                  📞 Call 14416
                </a>
                <a href="tel:18008914416" className="btn btn-secondary" aria-label="Call Tele MANAS 1800-89-14416">
                  📞 1800-89-14416
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Deaf, Hard of Hearing & Veterans banner */}
        <section className={styles.crisis} style={{ marginTop: 'var(--space-md)' }}>
          <div className={`card ${styles.crisisCard}`} style={{ borderLeftColor: 'var(--accent-400)' }}>
            <div className={styles.crisisContent}>
              <div>
                <h3>Deaf, Hard of Hearing & Veterans Support</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                  Dedicated crisis care and accessibility features, including veterans support:
                </p>
                <ul style={{ fontSize: '0.85rem', marginLeft: '20px', listStyleType: 'disc', color: 'var(--text-secondary)' }}>
                  <li><strong>Hearing Loss / Deaf Support:</strong> Call or text <strong>988</strong> using your preferred relay service, or dial TTY via <strong>711</strong> then <strong>988</strong>.</li>
                  <li><strong>Veterans Crisis Line:</strong> Dial <strong>988 then Press 1</strong>, or text <strong>838255</strong> for free, confidential support available 24/7.</li>
                  <li><strong>Online Chat:</strong> Access text-based chat support 24/7 at <a href="https://988lifeline.org/chat" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>988lifeline.org/chat</a>.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Geospatial Location Share Banner */}
        <section className={styles.crisis} style={{ marginTop: 'var(--space-md)' }}>
          <div className={`card ${styles.crisisCard}`} style={{ borderLeftColor: 'var(--info)' }}>
            <div className={styles.crisisContent}>
              <div style={{ flex: 1 }}>
                <h3>📍 Emergency Crisis Location Share</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                  If you need to share your coordinates with a family member, caregiver, or crisis responder, you can request your location below.
                </p>
                {coords && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--border-radius-md)', fontSize: '0.85rem', margin: '8px 0', border: '1px solid var(--border-color)' }}>
                    <p><strong>Latitude:</strong> {coords.latitude.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> {coords.longitude.toFixed(6)}</p>
                    <p style={{ marginTop: '4px', fontSize: '0.78rem', color: 'var(--primary-600)', wordBreak: 'break-all' }}>
                      <strong>Google Maps URL:</strong> <a href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>{`https://www.google.com/maps?q=${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`}</a>
                    </p>
                  </div>
                )}
                {locationError && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '6px' }}>⚠️ {locationError}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignSelf: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleFetchLocation()}
                  disabled={fetchingLocation}
                  className="btn btn-secondary"
                  id="btn-get-location"
                >
                  {fetchingLocation ? 'Fetching...' : coords ? '🔄 Refresh Location' : '📍 Get My Location'}
                </button>
                {coords && (
                  <button
                    type="button"
                    onClick={handleCopyLocationLink}
                    className="btn btn-primary"
                    id="btn-copy-location"
                  >
                    {copySuccess ? '✓ Link Copied!' : '📋 Copy Maps Link'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Desktop SMS Copy Modal Overlay */}
        {smsModalContact && (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-md)' }}
            onClick={() => setSmsModalContact(null)}
          >
            <div 
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', padding: 'var(--space-xl)', maxWidth: '480px', width: '100%', boxShadow: 'var(--shadow-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <h3 style={{ margin: 0 }}>📋 Send SMS to {smsModalContact.name}</h3>
                <button 
                  onClick={() => setSmsModalContact(null)} 
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                Copy the text below to send this emergency alert message to your supporter manually.
              </p>
              <textarea
                readOnly
                className="input"
                rows={5}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'none', background: 'var(--bg-secondary)', marginBottom: 'var(--space-md)' }}
                value={smsModalContact.text}
              />
              <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setSmsModalContact(null)} 
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(smsModalContact.text);
                    alert('Alert text copied to clipboard!');
                    setSmsModalContact(null);
                  }}
                  className="btn btn-primary"
                >
                  Copy Message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
