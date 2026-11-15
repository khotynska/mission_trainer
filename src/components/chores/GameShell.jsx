// Спільна рамка міні-гри: інструкція, ігрове поле, смужка прогресу й ✅ наприкінці.
export default function GameShell({ icon, title, progress, done, label, t, children, fieldProps = {} }) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <section className="mg" aria-label={title}>
      <p className="mg__title">
        <span aria-hidden="true">{icon}</span> {title}
      </p>
      <div {...fieldProps} className={`mg__field ${fieldProps.className ?? ''}`}>
        {children}
        {done && <span className="mg__done" aria-hidden="true">✅</span>}
      </div>
      <div className="mg__progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <span style={{ '--p': pct / 100 }} />
        <b>{done ? t('decision.task_done') : label}</b>
      </div>
    </section>
  );
}
