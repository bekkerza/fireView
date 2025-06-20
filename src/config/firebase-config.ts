import { z } from 'zod';

// Schema for the full Firebase config object, used internally and for initialization
export const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  authDomain: z.string().min(1, "Auth Domain is required"),
  projectId: z.string().min(1, "Project ID is required"),
  storageBucket: z.string().min(1, "Storage Bucket is required"),
  messagingSenderId: z.string().min(1, "Messaging Sender ID is required"),
  appId: z.string().min(1, "App ID is required"),
  measurementId: z.string().optional(),
});

export type FirebaseConfig = z.infer<typeof firebaseConfigSchema>;

// Schema for the connection form, which will only submit projectId
export const projectIdFormSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

export type ProjectIdFormData = z.infer<typeof projectIdFormSchema>;
