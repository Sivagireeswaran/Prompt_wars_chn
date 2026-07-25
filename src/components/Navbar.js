'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/firebase';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Don't show nav on landing or auth pages
  if (!user || pathname === '/' || pathname === '/auth') return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/companion', label: 'AI Companion', icon: '💬' },
    { href: '/education', label: 'Learn', icon: '📚' },
    { href: '/therapy-match', label: 'Find Clinics', icon: '📍' },
  ];

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }

  return (
    <>
      {/* Top Navbar */}
      <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
        <div className={styles.navContent}>
          <Link href="/dashboard" className={styles.logo} aria-label="RecovrAI Home">
            <span className={styles.logoIcon}>💚</span>
            <span className={styles.logoText}>RecovrAI</span>
          </Link>

          <div className={styles.navLinks}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className={styles.navActions}>
            <button
              onClick={handleSignOut}
              className={`btn btn-ghost btn-sm ${styles.signOutBtn}`}
              aria-label="Sign out"
            >
              Sign Out
            </button>
            <button
              className={styles.menuToggle}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className={styles.bottomNav} role="navigation" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.bottomNavItem} ${pathname === item.href ? styles.active : ''}`}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            <span className={styles.bottomNavIcon}>{item.icon}</span>
            <span className={styles.bottomNavLabel}>{item.label}</span>
          </Link>
        ))}
        <button onClick={handleSignOut} className={styles.bottomNavItem} aria-label="Sign out">
          <span className={styles.bottomNavIcon}>🚪</span>
          <span className={styles.bottomNavLabel}>Exit</span>
        </button>
      </nav>

      {/* Mobile slide menu */}
      {menuOpen && (
        <div className={styles.mobileMenu} role="dialog" aria-label="Navigation menu">
          <div className={styles.mobileMenuOverlay} onClick={() => setMenuOpen(false)} />
          <div className={styles.mobileMenuContent}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.mobileMenuItem}
                onClick={() => setMenuOpen(false)}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <button onClick={handleSignOut} className={styles.mobileMenuItem}>
              🚪 Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
