import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';

export default function OfflineBar() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const connRef = ref(db, '.info/connected');
    const unsub = onValue(connRef, (snap) => {
      setOnline(snap.val() === true);
    });
    return () => unsub();
  }, []);

  if (online) return null;

  return (
    <div className="offline-bar">
      Reconnecting…
    </div>
  );
}
