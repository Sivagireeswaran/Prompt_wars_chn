'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signIn, signUp, createUserProfile, signInWithGoogle, getUserProfile } from '@/lib/firebase';
import styles from './auth.module.css';

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('sivacodesss@gmail.com');
  const [password, setPassword] = useState('123456');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  async function handleGoogleSignIn() {
    setError('');
    setSubmitting(true);
    try {
      const cred = await signInWithGoogle();
      const existingProfile = await getUserProfile(cred.user.uid);
      
      // If user profile doesn't exist in Firestore, initialize it
      if (!existingProfile) {
        await createUserProfile(cred.user.uid, {
          displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Friend',
          email: cred.user.email,
          role: 'user',
          recoveryStage: 'early',
          primarySubstance: '',
          triggers: [],
          emergencyContacts: [],
          onboardingComplete: false,
        });
      }
      router.push('/dashboard');
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setError('Google Sign-In failed or was cancelled.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        const cred = await signUp(email, password);
        // Create user profile in Firestore
        await createUserProfile(cred.user.uid, {
          displayName: displayName || email.split('@')[0],
          email,
          role: 'user',
          recoveryStage: 'early',
          primarySubstance: '',
          triggers: [],
          emergencyContacts: [],
          onboardingComplete: false,
        });
      }
      router.push('/dashboard');
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
      };
      setError(messages[err.code] || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={`orb orb-primary ${styles.orb1}`} />
      <div className={`orb orb-accent ${styles.orb2}`} />

      <div className={styles.authContainer}>
        <div className={`card ${styles.authCard}`}>
          <div className={styles.authHeader}>
            <span className={styles.authLogo}>💚</span>
            <h1>{isLogin ? 'Welcome Back' : 'Join RecovrAI'}</h1>
            <p>
              {isLogin
                ? 'Sign in to continue your recovery journey'
                : 'Take the first step — create your account'}
            </p>
            {isLogin && (
              <div style={{ marginTop: '10px', padding: '8px 14px', background: 'var(--primary-500)15', border: '1px solid var(--primary-500)', borderRadius: 'var(--border-radius-md)', fontSize: '0.8rem', color: 'var(--primary-600)' }}>
                🎯 <strong>Demo credentials pre-filled</strong> — just click Sign In
              </div>
            )}
          </div>

          {error && (
            <div className={styles.errorMsg} role="alert">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.authForm}>
            {!isLogin && (
              <div className="input-group">
                <label htmlFor="displayName">Your Name</label>
                <input
                  id="displayName"
                  type="text"
                  className="input"
                  placeholder="How should we call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              style={{ width: '100%' }}
              id="auth-submit"
            >
              {submitting ? (
                <div className="spinner" style={{ borderTopColor: 'white' }} />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Google Sign In Divider */}
          <div className={styles.dividerBox}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or continue with</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Google Sign In button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="btn btn-secondary btn-lg"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}
            id="google-signin-btn"
          >
            <span>🌐</span> Sign In with Google
          </button>

          <div className={styles.authSwitch}>
            <p>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className={styles.switchBtn}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
