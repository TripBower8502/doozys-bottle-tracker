import { CATEGORIES } from '../constants';
import GuideSection from '../components/GuideSection';

export default function Guide({ bottles }) {
  return (
    <div className="tab-content guide">
      <h2 className="tab-title">Sales Guide</h2>
      <div className="ornament-sm">── ✦ ──</div>
      <p className="guide-intro">Tap any bottle for talking points, pairings & cocktail ideas.</p>
      {CATEGORIES.map((cat) => (
        <GuideSection
          key={cat}
          category={cat}
          bottles={bottles.filter((b) => b.category === cat)}
        />
      ))}
    </div>
  );
}
