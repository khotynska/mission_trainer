# Стилі гри: довідка для команди

Власник: **Dev 5 (Briefing UI)**. `theme.css` задає вигляд усієї гри в стилі **піксель-арт** зі
стартового екрана (гілка role6). Інші ролі використовують лише його змінні та класи.
Якщо потрібен новий колір чи розмір, напишіть Dev 5.

## Правила
- У компонентах **немає hex-кольорів і px-відступів**. Лише `var(--…)` з `theme.css`.
- **Піксельний шрифт (`--font-pixel`, Pixelify Sans) лише для коротких рядків**: заголовки, кнопки `.btn`, числа.
  Це шрифт для акцентів, а не для абзаців. Для решти є `--font` (Nunito):
  він не піксельний, зате добре читається і має правильну українську кирилицю.
- Довгі слова («Життєзабезпечення») не обрізайте трикрапкою. Дайте їм переноситися:
  `overflow-wrap: break-word; hyphens: auto;` + атрибут `lang` на секції (`uk-UA` / `en-US`).
- Базові стилі `button`, `h1–h4`, `a` мають нульову специфічність (`:where`), тож ваш клас чи
  inline-стиль завжди сильніший і нічого перебивати через `!important` не треба.
- Нічний режим працює сам: `App.jsx` ставить `.phase-night` на `.app`, і токени перевизначаються
  (рамки й кнопки стають блакитними, у небі з'являється Земля, пейзаж холоднішає).
- Зона натискання не менша за `var(--tap-min)` (44 px). Анімації вимикаються глобально через `prefers-reduced-motion`.

## Токени
| Група | Змінні |
|---|---|
| Палітра | `--px-night`, `--px-navy`, `--px-blue`, `--px-cream`, `--px-gold`, `--px-orange`, `--px-coral`, `--px-red`, `--px-wine`, `--px-plum` |
| Поверхні | `--space-dark`, `--space-panel`, `--space-raised` (= `--card`), `--space-sunken`, `--border`, `--border-strong` |
| Рамки | `--frame` + `--frame-shadow` (екрани), `--hud-frame` + `--hud-shadow` (панель ресурсів), `--frame-w`, `--border-w` |
| Текст | `--text`, `--text-muted`, `--heading`, `--eyebrow` |
| Акцент | `--accent`, `--accent-strong`, `--on-accent`, `--accent-soft`, `--accent-shadow`, `--focus` |
| Статуси | `--ok`, `--warning`, `--danger`, `--info` + `*-soft`; `--sun`, `--mars` |
| Ресурси | `--res-battery`, `--res-life`, `--res-science`, `--res-dose-ok/warn/danger` |
| Шрифти | `--font` (текст), `--font-pixel` (заголовки, числа), `--font-mono` (ID) |
| Розміри | текст `--fs-xs … --fs-2xl`; піксельний шрифт `--fs-px-xs … --fs-px-xl` |
| Відступи | `--gap-1` (4 px) … `--gap-6` (32 px) |
| Тіні | `--shadow-card`, `--shadow-hud`, `--shadow-btn`, `--shadow-sm` (жорсткі, без розмиття) |

Заокруглень немає: `--radius*` = 0, їх лишено лише для сумісності.

## Готові класи
| Клас | Для чого |
|---|---|
| `.screen`, `.screen__header`, `.screen__actions` | Каркас екрана: рамка, піксельні `h1–h3`, кнопки дій (на телефоні на всю ширину) |
| `button` | Піксельна рамка з тінню, читабельний шрифт: безпечно для будь-якого тексту |
| `.btn` + `--lg`, `--block`, `--secondary`, `--alt`, `--danger` | Кнопки як на стартовому екрані: Pixelify Sans, ВЕЛИКІ ЛІТЕРИ |
| `.card`, `.chip`, `.chip--pixel`, `.chip__icon` | Картка, бейдж, піксельний бейдж, emoji в бейджі |
| `.eyebrow`, `.px-text` | Дрібний піксельний підзаголовок; піксельний шрифт для короткого рядка |
| `.callout` + `--ok/--warning/--danger`, `__icon`, `__body`, `__title` | Повідомлення з іконкою |
| `.muted`, `.ok`, `.warning`, `.danger`, `.row`, `.visually-hidden` | Утиліти |

```jsx
<div className="screen__actions">
  <button type="button" className="btn btn--lg" onClick={next}>
    {t('common.next')} <span aria-hidden="true">→</span>
  </button>
</div>
```

## Файли
- `theme.css`: токени, база, тло (небо, зорі, що мерехтять, Сонце / Земля, пейзаж), примітиви
- `meters.css`, `briefing.css`, `result.css`, `fact-card.css`: стилі екранів Dev 5 (імпортуються з компонентів)

## Шрифти
Pixelify Sans і Nunito (ліцензія OFL) зараз підключені через Google Fonts, як і на стартовому екрані.
Для продакшену варто покласти `.woff2` у `src/styles/fonts/`, щоб не надсилати IP гравців у Google (GDPR).
