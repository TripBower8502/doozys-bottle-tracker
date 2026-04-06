import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAgW8fwGi4S56LnNlQovp7KJkd3FuEAhuo",
  authDomain: "doozy-s-tracker.firebaseapp.com",
  databaseURL: "https://doozy-s-tracker-default-rtdb.firebaseio.com",
  projectId: "doozy-s-tracker",
  storageBucket: "doozy-s-tracker.firebasestorage.app",
  messagingSenderId: "307472173373",
  appId: "1:307472173373:web:f722177852e393a8de1d54"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export { db, ref, onValue, set, update };
