
"use client";

import type { FirebaseApp } from 'firebase/app';
import type { Firestore, DocumentData } from 'firebase/firestore';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  initializeFirebaseAppClient, 
  getFirestoreInstance, 
  getCollectionDocuments, 
  addDocument as fbAddDocument,
  updateDocument as fbUpdateDocument,
  deleteDocument as fbDeleteDocument,
  type FetchedDocument 
} from '@/lib/firebase-client';
import { firebaseConfigSchema, type FirebaseConfig } from '@/config/firebase-config';
import { useToast } from '@/hooks/use-toast';

// Define the structure for documents to be bulk imported
export interface DocumentToImport {
  id?: string; // Optional: if provided, will be used as document ID
  data: DocumentData;
}

interface FirestoreContextType {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  config: FirebaseConfig | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: (projectId: string) => Promise<void>;
  disconnect: () => void;
  collections: UserCollection[];
  addCollection: (name: string) => void;
  removeCollection: (name:string) => void;
  selectedCollectionName: string | null;
  setSelectedCollectionName: (name: string | null) => void;
  documents: FetchedDocument[];
  fetchDocuments: (collectionName: string) => Promise<void>;
  isFetchingDocuments: boolean;
  currentSummary: string | null;
  isSummarizing: boolean;
  generateSummaryForCollection: (collectionName: string) => Promise<void>;
  
  addDocumentToCollection: (collectionName: string, data: DocumentData, documentId?: string) => Promise<string | void>;
  updateDocumentInCollection: (collectionName: string, documentId: string, data: Partial<DocumentData>) => Promise<void>;
  deleteDocumentFromCollection: (collectionName: string, documentId: string) => Promise<void>;
  isAddingDocument: boolean;
  isUpdatingDocument: Record<string, boolean>;
  isDeletingDocument: Record<string, boolean>;

  // Bulk import
  bulkAddDocumentsToCollection: (collectionName: string, documentsToImport: DocumentToImport[]) => Promise<{ successCount: number; errorCount: number; errors: string[] }>;
  isBulkImporting: boolean;
}

interface UserCollection {
  name: string;
}

const FirestoreContext = createContext<FirestoreContextType | undefined>(undefined);

const FIRESTORE_PROJECT_ID_LOCAL_STORAGE_KEY = 'fireview_firebase_project_id';

export const FirestoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);
  const [firestore, setFirestore] = useState<Firestore | null>(null);
  const [config, setConfig] = useState<FirebaseConfig | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [selectedCollectionName, setSelectedCollectionName] = useState<string | null>(null);
  const [documents, setDocuments] = useState<FetchedDocument[]>([]);
  const [isFetchingDocuments, setIsFetchingDocuments] = useState(false);
  
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [isUpdatingDocument, setIsUpdatingDocument] = useState<Record<string, boolean>>({});
  const [isDeletingDocument, setIsDeletingDocument] = useState<Record<string, boolean>>({});
  const [isBulkImporting, setIsBulkImporting] = useState(false);


  const connect = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    if (!projectId) {
        setError("Project ID is required.");
        setIsLoading(false);
        toast({ variant: "destructive", title: "Connection Error", description: "Project ID cannot be empty." });
        return;
    }

    const envConfig: Omit<FirebaseConfig, 'projectId'> = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
    };

    const fullConfig: FirebaseConfig = { ...envConfig, projectId };

    const validationResult = firebaseConfigSchema.safeParse(fullConfig);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join('; ');
      const userFriendlyMessage = "Missing Firebase configuration in environment variables. Please check your .env file for NEXT_PUBLIC_FIREBASE_* values.";
      console.error("Firebase config validation error:", errorMessages);
      setError(userFriendlyMessage);
      toast({ variant: "destructive", title: "Configuration Error", description: userFriendlyMessage });
      setIsLoading(false);
      return;
    }
    
    try {
      const app = initializeFirebaseAppClient(validationResult.data);
      const db = getFirestoreInstance();
      
      setFirebaseApp(app);
      setFirestore(db);
      setConfig(validationResult.data);
      setIsConnected(true);
      localStorage.setItem(FIRESTORE_PROJECT_ID_LOCAL_STORAGE_KEY, projectId);
      toast({ title: "Success", description: `Connected to Firestore project: ${projectId}.` });
    } catch (e: any) {
      console.error("Firebase connection error:", e);
      setError(e.message || "Failed to connect to Firestore. Check console for details.");
      toast({ variant: "destructive", title: "Connection Error", description: e.message || "Failed to connect." });
      setIsConnected(false);
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const storedProjectId = localStorage.getItem(FIRESTORE_PROJECT_ID_LOCAL_STORAGE_KEY);
    if (storedProjectId) {
      connect(storedProjectId);
    }
    const storedCollections = localStorage.getItem('fireview_user_collections');
    if (storedCollections) {
      setCollections(JSON.parse(storedCollections));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = useCallback(() => {
    setFirebaseApp(null);
    setFirestore(null);
    setConfig(null); 
    localStorage.removeItem(FIRESTORE_PROJECT_ID_LOCAL_STORAGE_KEY);
    setIsConnected(false);
    setCollections([]);
    setSelectedCollectionName(null);
    setDocuments([]);
    setCurrentSummary(null);
    setError(null);
    toast({ title: "Disconnected", description: "Disconnected from Firestore." });
  }, [toast]);

  const addCollection = (name: string) => {
    if (name && !collections.find(c => c.name === name)) {
      const updatedCollections = [...collections, { name }];
      setCollections(updatedCollections);
      localStorage.setItem('fireview_user_collections', JSON.stringify(updatedCollections));
      if (!selectedCollectionName) {
        setSelectedCollectionName(name);
      }
    }
  };

  const removeCollection = (name: string) => {
    const updatedCollections = collections.filter(c => c.name !== name);
    setCollections(updatedCollections);
    localStorage.setItem('fireview_user_collections', JSON.stringify(updatedCollections));
    if (selectedCollectionName === name) {
      setSelectedCollectionName(updatedCollections.length > 0 ? updatedCollections[0].name : null);
      setDocuments([]);
      setCurrentSummary(null);
    }
  };

  const fetchDocuments = useCallback(async (collectionName: string) => {
    if (!firestore || !isConnected) {
      // toast({ variant: "destructive", title: "Not Connected", description: "Please connect to Firestore first." });
      return;
    }
    setIsFetchingDocuments(true);
    setDocuments([]); 
    setCurrentSummary(null); 
    setError(null); 
    try {
      const docs = await getCollectionDocuments(collectionName);
      setDocuments(docs);
    } catch (e: any) {
      console.error(`Error fetching documents for ${collectionName}:`, e);
      setError(e.message || `Failed to fetch documents for ${collectionName}. Check Firestore rules or path.`);
      toast({ variant: "destructive", title: "Fetch Error", description: e.message || `Failed to fetch documents for ${collectionName}.` });
      setDocuments([]);
    } finally {
      setIsFetchingDocuments(false);
    }
  }, [firestore, isConnected, toast]);

  useEffect(() => {
    if (selectedCollectionName && isConnected) {
      fetchDocuments(selectedCollectionName);
    } else if (!isConnected) {
      setDocuments([]);
      setCurrentSummary(null);
    } else {
      setDocuments([]); 
      setCurrentSummary(null);
      setError(null);
    }
  }, [selectedCollectionName, fetchDocuments, isConnected]);

  const generateSummaryForCollection = async (collectionName: string) => {
    if (!documents.length) {
      toast({ variant: "destructive", title: "No Documents", description: "No documents to summarize. Fetch documents first or collection is empty." });
      return;
    }
    setIsSummarizing(true);
    setCurrentSummary(null);
    
    try {
      const { summarizeCollection } = await import('@/ai/flows/summarize-collection');
      const documentContent = JSON.stringify(documents.map(doc => ({ id: doc.id, ...doc.data })));
      const input = { collectionName, documentContent };
      
      const result = await summarizeCollection(input);
      setCurrentSummary(result.summary);
      toast({ title: "Summary Generated", description: `AI summary for ${collectionName} is ready.` });
    } catch (e: any) {
      console.error("Error generating summary:", e);
      toast({ variant: "destructive", title: "Summarization Error", description: e.message || "Could not generate summary." });
    } finally {
      setIsSummarizing(false);
    }
  };

  const addDocumentToCollection = async (collectionName: string, data: DocumentData, documentId?: string): Promise<string | void> => {
    if (!firestore || !isConnected) {
      toast({ variant: "destructive", title: "Not Connected", description: "Please connect to Firestore first." });
      return;
    }
    setIsAddingDocument(true);
    try {
      const newDocId = await fbAddDocument(collectionName, data, documentId);
      toast({ title: "Document Added", description: `Document ${newDocId} added to ${collectionName}.` });
      await fetchDocuments(collectionName);
      return newDocId;
    } catch (e: any) {
      console.error("Error adding document:", e);
      toast({ variant: "destructive", title: "Add Document Error", description: e.message || "Could not add document." });
    } finally {
      setIsAddingDocument(false);
    }
  };

  const updateDocumentInCollection = async (collectionName: string, documentId: string, data: Partial<DocumentData>) => {
    if (!firestore || !isConnected) {
      toast({ variant: "destructive", title: "Not Connected", description: "Please connect to Firestore first." });
      return;
    }
    setIsUpdatingDocument(prev => ({ ...prev, [documentId]: true }));
    try {
      await fbUpdateDocument(collectionName, documentId, data);
      toast({ title: "Document Updated", description: `Document ${documentId} in ${collectionName} updated.` });
      await fetchDocuments(collectionName);
    } catch (e: any)
     {
      console.error("Error updating document:", e);
      toast({ variant: "destructive", title: "Update Document Error", description: e.message || "Could not update document." });
    } finally {
      setIsUpdatingDocument(prev => ({ ...prev, [documentId]: false }));
    }
  };

  const deleteDocumentFromCollection = async (collectionName: string, documentId: string) => {
    if (!firestore || !isConnected) {
      toast({ variant: "destructive", title: "Not Connected", description: "Please connect to Firestore first." });
      return;
    }
    setIsDeletingDocument(prev => ({ ...prev, [documentId]: true }));
    try {
      await fbDeleteDocument(collectionName, documentId);
      toast({ title: "Document Deleted", description: `Document ${documentId} from ${collectionName} deleted.` });
      await fetchDocuments(collectionName);
    } catch (e: any) {
      console.error("Error deleting document:", e);
      toast({ variant: "destructive", title: "Delete Document Error", description: e.message || "Could not delete document." });
    } finally {
      setIsDeletingDocument(prev => ({ ...prev, [documentId]: false }));
    }
  };

  const bulkAddDocumentsToCollection = async (collectionName: string, documentsToImport: DocumentToImport[]): Promise<{ successCount: number; errorCount: number; errors: string[] }> => {
    if (!firestore || !isConnected) {
      toast({ variant: "destructive", title: "Not Connected", description: "Please connect to Firestore first." });
      return { successCount: 0, errorCount: documentsToImport.length, errors: ["Not connected to Firestore."] };
    }
    if (!documentsToImport || documentsToImport.length === 0) {
      return { successCount: 0, errorCount: 0, errors: [] };
    }

    setIsBulkImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const docToImport of documentsToImport) {
      try {
        await fbAddDocument(collectionName, docToImport.data, docToImport.id);
        successCount++;
      } catch (e: any) {
        console.error(`Error importing document (ID: ${docToImport.id || 'auto'}):`, e);
        errors.push(e.message || `Failed to import document (ID: ${docToImport.id || 'auto'}).`);
        errorCount++;
      }
    }

    if (successCount > 0) {
      await fetchDocuments(collectionName); // Refresh documents list if at least one succeeded
    }
    setIsBulkImporting(false);
    return { successCount, errorCount, errors };
  };


  return (
    <FirestoreContext.Provider value={{
      firebaseApp,
      firestore,
      config,
      isConnected,
      isLoading,
      error,
      connect,
      disconnect,
      collections,
      addCollection,
      removeCollection,
      selectedCollectionName,
      setSelectedCollectionName,
      documents,
      fetchDocuments,
      isFetchingDocuments,
      currentSummary,
      isSummarizing,
      generateSummaryForCollection,
      addDocumentToCollection,
      updateDocumentInCollection,
      deleteDocumentFromCollection,
      isAddingDocument,
      isUpdatingDocument,
      isDeletingDocument,
      bulkAddDocumentsToCollection,
      isBulkImporting,
    }}>
      {children}
    </FirestoreContext.Provider>
  );
};

export const useFirestore = (): FirestoreContextType => {
  const context = useContext(FirestoreContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirestoreProvider');
  }
  return context;
};
