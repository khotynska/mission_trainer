// Власник: Dev 6 (Progress UI). Значок нашивки: emoji в колі. Використовують Start, MissionMap, WeekComplete, Certificate.
import { PATCHES } from './patches.js';

export default function PatchBadge({ id, earned = true, size = 48, label }) {
    const p = PATCHES.find((x) => x.id === id);
    return (
        <span
            role="img"
            title={label}
            aria-label={label}
            style={{
                display: 'inline-flex',
                flex: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: size,
                height: size,
                borderRadius: '50%',
                fontSize: size * 0.5,
                border: '2px solid var(--accent, #ffcc4d)',
                background: earned ? 'var(--card, #161d3d)' : 'transparent',
                opacity: earned ? 1 : 0.3,
                filter: earned ? 'none' : 'grayscale(1)',
            }}
        >
            {p ? p.icon : '?'}
        </span>
    );
}
