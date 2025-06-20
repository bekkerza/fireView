import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  type Firestore, 
  type DocumentData, 
  type QueryDocumentSnapshot, 
  FirestoreError 
} from 'firebase/firestore';
import type { FirebaseConfig } from '@/config/firebase-config';

let firebaseApp: FirebaseApp | null = null;

export const initializeFirebaseAppClient = (config: FirebaseConfig): FirebaseApp => {
  if (!getApps().length) {
    firebaseApp = initializeApp(config);
  } else {
    firebaseApp = getApp();
  }
  return firebaseApp;
};

export const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp) {
    throw new Error("Firebase app has not been initialized. Call initializeFirebaseAppClient first.");
  }
  return firebaseApp;
}

export const getFirestoreInstance = (): Firestore => {
  const app = getFirebaseApp();
  return getFirestore(app);
};

export interface FetchedDocument {
  id: string;
  data: DocumentData;
}

export const getCollectionDocuments = async (collectionPath: string): Promise<FetchedDocument[]> => {
  if (!collectionPath) {
    console.error("Collection path cannot be empty.");
    return [];
  }
  try {
    const db = getFirestoreInstance();
    const collectionRef = collection(db, collectionPath);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => ({
      id: docSnap.id,
      data: docSnap.data(),
    }));
  } catch (error) {
    if (error instanceof FirestoreError) {
      console.error(`Firestore error getting documents from ${collectionPath}:`, error.message, error.code);
      if (error.code === 'permission-denied') {
        throw new Error(`Permission denied. Check your Firestore rules for collection '${collectionPath}'.`);
      } else if (error.code === 'unauthenticated') {
         throw new Error('Authentication required. Please ensure you are connected and authenticated.');
      }
    } else {
      console.error(`Error getting documents from ${collectionPath}:`, error);
    }
    throw new Error(`Failed to fetch documents from collection '${collectionPath}'.`);
  }
};

export const getDocumentById = async (collectionPath: string, documentId: string): Promise<FetchedDocument | null> => {
  try {
    const db = getFirestoreInstance();
    const docRef = doc(db, collectionPath, documentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, data: docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error getting document ${documentId} from ${collectionPath}:`, error);
    throw error;
  }
};

export const addDocument = async (collectionPath: string, data: DocumentData, documentId?: string): Promise<string> => {
  const db = getFirestoreInstance();
  try {
    if (documentId) {
      // If documentId is provided, use setDoc to create document with specific ID
      const docRef = doc(db, collectionPath, documentId);
      await setDoc(docRef, data);
      return documentId;
    } else {
      // If no documentId, use addDoc to auto-generate ID
      const collectionRef = collection(db, collectionPath);
      const docRef = await addDoc(collectionRef, data);
      return docRef.id;
    }
  } catch (error) {
    console.error(`Error adding document to ${collectionPath}:`, error);
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      throw new Error(`Permission denied. Cannot add document to '${collectionPath}'. Check Firestore rules.`);
    }
    throw new Error(`Failed to add document to collection '${collectionPath}'.`);
  }
};

export const updateDocument = async (collectionPath: string, documentId: string, data: Partial<DocumentData>): Promise<void> => {
  const db = getFirestoreInstance();
  const docRef = doc(db, collectionPath, documentId);
  try {
    await updateDoc(docRef, data);
  } catch (error) {
    console.error(`Error updating document ${documentId} in ${collectionPath}:`, error);
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      throw new Error(`Permission denied. Cannot update document '${documentId}' in '${collectionPath}'. Check Firestore rules.`);
    }
    throw new Error(`Failed to update document '${documentId}' in collection '${collectionPath}'.`);
  }
};

export const deleteDocument = async (collectionPath: string, documentId: string): Promise<void> => {
  const db = getFirestoreInstance();
  const docRef = doc(db, collectionPath, documentId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${documentId} from ${collectionPath}:`, error);
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      throw new Error(`Permission denied. Cannot delete document '${documentId}' from '${collectionPath}'. Check Firestore rules.`);
    }
    throw new Error(`Failed to delete document '${documentId}' from collection '${collectionPath}'.`);
  }
};
