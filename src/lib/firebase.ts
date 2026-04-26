import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function readFirebaseConfig() {
  const globalConfig = (globalThis as any).__firebase_config;
  if (globalConfig) {
    try {
      return typeof globalConfig === 'string' ? JSON.parse(globalConfig) : globalConfig;
    } catch {
      return {};
    }
  }

  return {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID
  };
}

export const firebaseAppId =
  (globalThis as any).__app_id || import.meta.env.PUBLIC_FIREBASE_APP_ID || 'german-astro-site';

export const firebaseConfig = readFirebaseConfig();
export const hasFirebaseConfig = Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId);

let firebaseServices: any = null;

export function getFirebaseServices() {
  if (!hasFirebaseConfig) return null;

  if (!firebaseServices) {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    firebaseServices = {
      app,
      auth: getAuth(app),
      db: getFirestore(app)
    };
  }

  return firebaseServices;
}
