export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-base font-semibold text-ink-faint">{eyebrow}</p>}
        <h1 className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
