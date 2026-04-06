import { useEffect, useState } from 'react';

export default function FlashBanner({ message, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 2200);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className={`flash-banner${visible ? ' show' : ''}`}>
      <span className="flash-icon">🍾</span> {message}
    </div>
  );
}
