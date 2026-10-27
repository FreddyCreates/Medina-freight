import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  deleteDoc,
  initializeFirestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with databaseId if specified
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

export const isFirebaseAvailable = () => {
  return !!db && !!firebaseConfig.projectId;
};

/**
 * Generic helper to save or update a document in Firestore
 */
export async function saveDocumentToFirestore<T extends { id: string }>(
  collectionName: string, 
  data: T
): Promise<boolean> {
  try {
    if (!isFirebaseAvailable()) return false;
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Firestore save error for ${collectionName}:`, err);
    return false;
  }
}

/**
 * Generic helper to delete a document from Firestore
 */
export async function deleteDocumentFromFirestore(
  collectionName: string, 
  id: string
): Promise<boolean> {
  try {
    if (!isFirebaseAvailable()) return false;
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn(`Firestore delete error for ${collectionName}:`, err);
    return false;
  }
}

/**
 * Load all documents from a Firestore collection
 */
export async function loadCollectionFromFirestore<T>(collectionName: string): Promise<T[]> {
  try {
    if (!isFirebaseAvailable()) return [];
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as T);
    });
    return items;
  } catch (err) {
    console.warn(`Firestore load error for ${collectionName}:`, err);
    return [];
  }
}

/**
 * Subscribe to real-time updates for a collection
 */
export function subscribeToCollection<T>(
  collectionName: string, 
  onData: (items: T[]) => void
) {
  if (!isFirebaseAvailable()) return () => {};

  try {
    return onSnapshot(collection(db, collectionName), (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as T);
      });
      if (items.length > 0) {
        onData(items);
      }
    }, (err) => {
      console.warn(`Firestore snapshot listener error for ${collectionName}:`, err);
    });
  } catch (err) {
    console.warn(`Firestore subscribe exception for ${collectionName}:`, err);
    return () => {};
  }
}

/**
 * Save singleton configuration (e.g. Company Profile)
 */
export async function saveSingletonToFirestore<T>(docId: string, data: T): Promise<boolean> {
  try {
    if (!isFirebaseAvailable()) return false;
    const docRef = doc(db, 'system_configs', docId);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Firestore saveSingleton error for ${docId}:`, err);
    return false;
  }
}

/**
 * Load singleton configuration
 */
export async function loadSingletonFromFirestore<T>(docId: string): Promise<T | null> {
  try {
    if (!isFirebaseAvailable()) return null;
    const docRef = doc(db, 'system_configs', docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as T;
    }
    return null;
  } catch (err) {
    console.warn(`Firestore loadSingleton error for ${docId}:`, err);
    return null;
  }
}
