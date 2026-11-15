// Тост «🏅 Новий значок!» + конфеті, коли в state.patches з'являється значок досягнення.
// Нашивки тижнів святкує екран тижня, тож для них тосту немає.
import { useEffect, useRef, useState } from 'react';
import { PATCHES, WEEK_PATCH_IDS } from './patches.js';
import Confetti from './Confetti.jsx';
import { play } from './sfx.js';
import '../styles/fx.css';

const SHOW_MS = 3200;

export default function BadgeToast({ patches = [], t }) {
  const seen = useRef(patches);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const added = patches.filter((id) => !seen.current.includes(id) && !WEEK_PATCH_IDS.includes(id));
    seen.current = patches;
    if (added.length) {
      setQueue((q) => [...q, ...added]);
      play('badge');
    }
  }, [patches]);

  useEffect(() => {
    if (queue.length === 0) return undefined;
    const id = setTimeout(() => setQueue((q) => q.slice(1)), SHOW_MS);
    return () => clearTimeout(id);
  }, [queue]);

  const current = queue[0];
  if (!current) return null;
  const badge = PATCHES.find((p) => p.id === current);
  return (
    <>
      <Confetti burst={current} />
      <div className="toast" role="status" key={current}>
        <span className="toast__badge" aria-hidden="true">{badge?.icon ?? '🏅'}</span>
        <span>
          <span className="toast__title">{t('progress.badge.new')}</span>
          <br />
          <span className="toast__name">{t(`progress.patch.${current}`)}</span>
        </span>
      </div>
    </>
  );
}
