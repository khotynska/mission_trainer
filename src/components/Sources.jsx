// Власник: Dev 3. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
// Посилання не перекладаються, тому живуть тут, а не в i18n.
const SECTIONS = [
  {
    key: 'donki',
    links: [{ label: 'NASA DONKI', href: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/' }],
    highlights: ['highlight_1', 'highlight_2', 'highlight_3'],
  },
  {
    key: 'facts',
    links: [
      { label: 'NASA Science — Moon', href: 'https://science.nasa.gov/moon/' },
      { label: 'NASA Science — Sun', href: 'https://science.nasa.gov/sun/' },
    ],
  },
  {
    key: 'phases',
    links: [{ label: 'NASA Science — Moon Phases', href: 'https://science.nasa.gov/moon/moon-phases/' }],
  },
  { key: 'note', links: [] },
];

export default function Sources({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  return (
    <div className="screen">
      <h2>{t('sources.title')}</h2>
      <p>{t('sources.intro')}</p>
      {SECTIONS.map(({ key, links, highlights }) => (
        <section key={key}>
          <h3>{t(`sources.${key}_title`)}</h3>
          <p>{t(`sources.${key}_text`)}</p>
          {highlights && (
            <>
              <h4>{t('sources.highlights_title')}</h4>
              <ul>
                {highlights.map((h) => <li key={h}>{t(`sources.${h}`)}</li>)}
              </ul>
            </>
          )}
          {links.map((l) => (
            <p key={l.href}>
              <a href={l.href} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{l.label} ↗</a>
            </p>
          ))}
        </section>
      ))}
      <button onClick={() => dispatch({ type: 'GO', screen: 'start' })}>{t('sources.back')}</button>
    </div>
  );
}
