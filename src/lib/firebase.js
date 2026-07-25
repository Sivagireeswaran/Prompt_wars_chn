// Firebase Client SDK Service & Data Isolation Layer
// Provides typed Auth listeners, Firestore user profile persistence, and conversation logging.

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  limit,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Gracefully handle missing config (build-time safety)
const isConfigured = !!firebaseConfig.apiKey;
let app = null;
let auth = null;
let db = null;

if (isConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn('Firebase config missing — auth and Firestore are running in fallback mode.');
}

// ─── Auth Helpers ───────────────────────────────────────────

/**
 * Sign in user with email & password credentials
 * @param {string} email
 * @param {string} password
 */
export async function signIn(email, password) {
  if (!auth) throw new Error('Firebase auth not configured');
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Register new user with email & password
 * @param {string} email
 * @param {string} password
 */
export async function signUp(email, password) {
  if (!auth) throw new Error('Firebase auth not configured');
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in with Google OAuth Popup
 */
export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase auth not configured');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

/**
 * Sign out active user
 */
export async function signOut() {
  if (!auth) return;
  return firebaseSignOut(auth);
}

/**
 * Subscribe to Firebase Auth state changes
 * @param {Function} callback
 */
export function onAuthChange(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ─── User Profile Helpers ───────────────────────────────────

/**
 * Fetch user profile from Firestore by UID
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function getUserProfile(uid) {
  if (!db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.warn('getUserProfile failed, using account fallback cache:', err.message);
    return null;
  }
}

/**
 * Create a new user profile document
 * @param {string} uid
 * @param {Object} data
 */
export async function createUserProfile(uid, data) {
  if (!db || !uid) return;
  try {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('createUserProfile failed:', err.message);
  }
}

/**
 * Update an existing user profile document
 * @param {string} uid
 * @param {Object} data
 */
export async function updateUserProfile(uid, data) {
  if (!db || !uid) return;
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('updateUserProfile failed:', err.message);
  }
}

/**
 * Update Emergency Supporters for a specific user account
 * @param {string} uid
 * @param {Array} contacts
 * @returns {Promise<boolean>}
 */
export async function updateEmergencyContacts(uid, contacts) {
  if (!db || !uid) return false;
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        emergencyContacts: contacts,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('updateEmergencyContacts failed, fallback active:', err.message);
    return false;
  }
}

// ─── Conversation Helpers ───────────────────────────────────

/**
 * Save chat conversation log to Firestore
 * @param {string} userId
 * @param {Array} messages
 * @param {string} [context]
 * @returns {Promise<string|null>}
 */
export async function saveConversation(userId, messages, context = '') {
  if (!db || !userId) return null;
  try {
    const ref = await addDoc(collection(db, 'conversations'), {
      userId,
      messages,
      context,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.warn('saveConversation failed:', err.message);
    return null;
  }
}

/**
 * Fetch past conversations for a user
 * @param {string} userId
 * @param {number} [maxResults=10]
 * @returns {Promise<Array>}
 */
export async function getConversations(userId, maxResults = 10) {
  if (!db || !userId) return [];
  try {
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('getConversations failed:', err.message);
    return [];
  }
}

export { auth, db };
