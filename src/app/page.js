'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className={styles.landing}>
      {/* Decorative orbs */}
      <div className={`orb orb-primary ${styles.orb1}`} />
      <div className={`orb orb-accent ${styles.orb2}`} />

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.headerLogo}>
            <span>💚</span> RecovrAI
          </Link>
          <Link href="/auth" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span>🤖</span> Powered by Google Gemini AI
          </div>
          <h1 className={styles.heroTitle}>
            Your AI-Powered
            <br />
            <span className="gradient-text">Recovery Companion</span>
          </h1>
          <p className={styles.heroSubtitle}>
            A compassionate, voice-first platform that supports individuals
            navigating substance use disorders — and the people who care about
            them. Zero typing required.
          </p>
          <div className={styles.heroCTA}>
            <Link href="/auth" className="btn btn-primary btn-lg" id="hero-cta">
              Start Your Journey
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className="container">
          <h2 className={styles.sectionTitle}>How RecovrAI Helps</h2>
          <div className={`grid grid-2 stagger`}>
            <div className={`card ${styles.featureCard} animate-fade-in-up`}>
              <div className={styles.featureIcon}>💬</div>
              <h3>AI Recovery Companion</h3>
              <p>
                Talk to an empathetic AI companion using your voice — no typing
                needed. Get evidence-based support anytime, day or night.
              </p>
            </div>
            <div className={`card ${styles.featureCard} animate-fade-in-up`}>
              <div className={styles.featureIcon}>📚</div>
              <h3>Personalized Education</h3>
              <p>
                AI-curated educational content tailored to your recovery stage.
                Understand your journey with clear, accessible information.
              </p>
            </div>
            <div className={`card ${styles.featureCard} animate-fade-in-up`}>
              <div className={styles.featureIcon}>🛡️</div>
              <h3>Safety Planning</h3>
              <p>
                Build a personalized safety plan with AI-generated coping
                strategies, support contacts, and emergency resources.
              </p>
            </div>
            <div className={`card ${styles.featureCard} animate-fade-in-up`}>
              <div className={styles.featureIcon}>📍</div>
              <h3>Recovery Clinics & Specialists</h3>
              <p>
                Find verified de-addiction centers, addiction psychiatrists, and
                clinical psychologists near you — with live Google Maps fallback
                for any city.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.trust}>
        <div className="container">
          <div className={`card card-glass ${styles.trustCard}`}>
            <h3>If you&apos;re in crisis right now</h3>
            <p>
              Please reach out to the{' '}
              <strong>988 Suicide & Crisis Lifeline</strong> by calling or
              texting <strong>988</strong>. You are not alone.
            </p>
            <a
              href="tel:988"
              className="btn btn-danger btn-lg"
              aria-label="Call 988 Crisis Lifeline"
            >
              📞 Call 988 Now
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          Built with 💚 for recovery. RecovrAI is not a substitute for
          professional medical or psychological treatment.
        </p>
      </footer>
    </div>
  );
}
