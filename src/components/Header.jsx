export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <svg className="logo-svg" viewBox="0 0 660 460" width="280" height="195">
          {/* ST. FLORIAN text — above banner */}
          <text
            x="330" y="24"
            textAnchor="middle"
            fontFamily="'Cinzel', serif"
            fontSize="22"
            fill="#3a3a3a"
            letterSpacing="6"
          >
            ST. FLORIAN
          </text>
          {/* Bowtie banner shape */}
          <polygon
            points="30,115 330,40 630,115 630,325 330,400 30,325"
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="2.5"
          />
          {/* DOOZY'S main text */}
          <text
            x="330" y="245"
            textAnchor="middle"
            fontFamily="'Cinzel', serif"
            fontSize="108"
            fontWeight="700"
            fill="#2a2a2a"
            letterSpacing="8"
          >
            DOOZY'S
          </text>
          {/* DOOZY'S outline effect */}
          <text
            x="330" y="245"
            textAnchor="middle"
            fontFamily="'Cinzel', serif"
            fontSize="108"
            fontWeight="700"
            fill="none"
            stroke="#555"
            strokeWidth="0.5"
            letterSpacing="8"
          >
            DOOZY'S
          </text>
          {/* FINE WINE • SPIRITS • ALE — below banner */}
          <text
            x="330" y="450"
            textAnchor="middle"
            fontFamily="'Cinzel', serif"
            fontSize="28"
            fontWeight="600"
            fill="#c9a227"
            letterSpacing="8"
          >
            FINE WINE • SPIRITS • ALE
          </text>
        </svg>
        <div className="header-text">
          <div className="ornament">✦ ─── ✦ ─── ✦</div>
          <p className="app-subtitle">Bottle Tracker</p>
        </div>
      </div>
    </header>
  );
}
