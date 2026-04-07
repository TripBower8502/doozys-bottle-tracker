import { useState, useEffect } from 'react';

const DISMISS_KEY = 'dz3_install_dismissed';

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone) return;

    // iOS detection
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIOS(ios);

    if (ios) {
      setShow(true);
      return;
    }

    // Android / Chrome — beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="install-banner">
      <button className="install-close" onClick={dismiss}>×</button>
      <div className="install-content">
        <div className="install-icon">📲</div>
        <div className="install-text">
          <strong>Add Doozy's to your home screen</strong>
          {isIOS ? (
            <span>Tap <span className="install-share">⎙</span> then "Add to Home Screen"</span>
          ) : (
            <span>Install for a faster, app-like experience</span>
          )}
        </div>
        {!isIOS && (
          <button className="btn-gold install-btn" onClick={install}>Install</button>
        )}
      </div>
    </div>
  );
}
