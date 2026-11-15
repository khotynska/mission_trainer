// Інтерактивна інструкція з астронавткою Новою: підсвічує частину екрана, дитина торкається її — і далі.
// Останній крок — «Обери кнопку!»: торкання варіанта завершує інструкцію й одразу робить вибір.
// Запускається в перший день (state.tutorial) і кнопкою ❓ на панелі. Кроки без цілі на екрані пропускаються.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ACTIONS } from '../game/contracts.js';
import Astronaut from './Astronaut.jsx';
import { play } from './sfx.js';
import '../styles/tutorial.css';

const STEPS = [
  { id: 'hello' },
  { id: 'battery', target: '[data-tour="battery"]' },
  { id: 'life', target: '[data-tour="life"]' },
  { id: 'mood', target: '[data-tour="mood"]' },
  { id: 'dose', target: '[data-tour="dose"]' },
  { id: 'science', target: '[data-tour="science"]' },
  { id: 'clock', target: '[data-tour="clock"]' },
  { id: 'lira', target: '[data-tour="lira"]' },
  { id: 'choices', target: '[data-tour="choices"]', final: true },
];
const PAD = 6;

const findTarget = (step) => (step?.target ? document.querySelector(step.target) : null);

export default function Tutorial({ dispatch, t }) {
  const [steps, setSteps] = useState(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const cardRef = useRef(null);
  const nextRef = useRef(null);
  const step = steps?.[index];
  const isLast = steps ? index === steps.length - 1 : false;

  // Які кроки мають ціль на цьому екрані. Читаємо DOM, тож лише після коміту екрана (layout effect).
  useLayoutEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- синхронізація з DOM екрана, який щойно змонтувався
    setSteps(STEPS.filter((s) => !s.target || findTarget(s)));
  }, []);

  const end = useCallback(() => dispatch({ type: ACTIONS.TUTORIAL_END }), [dispatch]);
  const next = useCallback(() => {
    play('click');
    if (isLast) end();
    else setIndex((i) => i + 1);
  }, [isLast, end]);

  // Прокрутити до цілі й стежити за її місцем (панель липка, сторінка може прокручуватися)
  useEffect(() => {
    if (!step) return undefined;
    const el = findTarget(step);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    let raf = 0;
    const loop = () => {
      const r = el?.getBoundingClientRect();
      setRect((prev) => {
        if (!r) return null;
        if (prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height) return prev;
        return { top: r.top, left: r.left, width: r.width, height: r.height };
      });
      raf = requestAnimationFrame(loop);
    };
    loop();
    nextRef.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(raf);
  }, [step]);

  // Торкання: ціль → наступний крок; картка — як звичайно; усе інше заблоковано
  useEffect(() => {
    if (!step) return undefined;
    const onClick = (e) => {
      if (cardRef.current?.contains(e.target)) return;
      const el = findTarget(step);
      if (el && el.contains(e.target)) {
        if (step.final) end(); // вибір у дилемі спрацює як звичайно
        else next();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') end();
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [step, next, end]);

  if (!step) return null;

  const ring = rect && {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
  // Картка там, де не заважає: ціль унизу → картка вгорі
  const cardAtTop = rect ? rect.top + rect.height / 2 > window.innerHeight * 0.55 : false;

  return (
    <div className="tour" role="dialog" aria-modal="false" aria-label={t('tutorial.title')}>
      {ring ? <div className="tour__ring" style={ring} /> : <div className="tour__dim" />}
      <div ref={cardRef} className="tour__card" data-at={cardAtTop ? 'top' : 'bottom'}>
        <Astronaut label={t('tutorial.name')} />
        <div className="tour__body">
          <p className="tour__name">{t('tutorial.name')} <span className="tour__step">{index + 1}/{steps.length}</span></p>
          <p className="tour__text" aria-live="polite">{t(`tutorial.steps.${step.id}`)}</p>
          {step.target && <p className="tour__tap">👆 {t(step.final ? 'tutorial.tap_choice' : 'tutorial.tap')}</p>}
          <div className="tour__actions">
            <button type="button" className="tour__skip" onClick={end}>{t('tutorial.skip')}</button>
            {!step.final && (
              <button ref={nextRef} type="button" className="btn tour__next" onClick={next}>
                {index === 0 ? t('tutorial.go') : isLast ? t('tutorial.done') : t('tutorial.next')} <span aria-hidden="true">▶</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
