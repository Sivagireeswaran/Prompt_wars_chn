// Firebase client SDK configuration
// This module initializes Firebase Auth and Firestore for client-side use.

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
  console.warn('Firebase config missing — auth and Firestore are disabled.');
}

// ─── Auth Helpers ───────────────────────────────────────────

export async function signIn(email, password) {
  if (!auth) throw new Error('Firebase not configured');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email, password) {
  if (!auth) throw new Error('Firebase not configured');
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOut() {
  if (!auth) return;
  return firebaseSignOut(auth);
}

export function onAuthChange(callback) {
  if (!auth) {
    // Immediately call with null user when Firebase isn't configured
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ─── User Profile Helpers ───────────────────────────────────

export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.warn('getUserProfile failed, returning null:', err.message);
    return null;
  }
}

export async function createUserProfile(uid, data) {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('createUserProfile failed:', err.message);
  }
}

export async function updateUserProfile(uid, data) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('updateUserProfile failed:', err.message);
  }
}

export async function updateEmergencyContacts(uid, contacts) {
  try {
    // Use setDoc with merge:true so it works even if the field doesn't exist yet
    await setDoc(doc(db, 'users', uid), {
      emergencyContacts: contacts,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('updateEmergencyContacts failed:', err.message);
    return false;
  }
}

// ─── Conversation Helpers ───────────────────────────────────

export async function saveConversation(userId, messages, context = '') {
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

export async function getConversations(userId, maxResults = 10) {
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
    console.warn('getConversations failed, returning []:', err.message);
    return [];
  }
}

// ─── Safety Plan Helpers ────────────────────────────────────

export async function saveSafetyPlan(userId, planData) {
  try {
    const q = query(
      collection(db, 'safetyPlans'),
      where('userId', '==', userId),
      limit(1)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      const ref = await addDoc(collection(db, 'safetyPlans'), {
        userId,
        ...planData,
        updatedAt: serverTimestamp(),
      });
      return ref.id;
    } else {
      const existingDoc = snap.docs[0];
      await updateDoc(doc(db, 'safetyPlans', existingDoc.id), {
        ...planData,
        updatedAt: serverTimestamp(),
      });
      return existingDoc.id;
    }
  } catch (err) {
    console.warn('saveSafetyPlan failed:', err.message);
    return null;
  }
}

export async function getSafetyPlan(userId) {
  try {
    const q = query(
      collection(db, 'safetyPlans'),
      where('userId', '==', userId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (err) {
    console.warn('getSafetyPlan failed, returning null:', err.message);
    return null;
  }
}

export { auth, db };
