export function QuietMetric({ label, value, hint }) {
  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <dt className="text-base font-medium text-ink-soft">{label}</dt>
      <dd className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums text-ink">{value}</dd>
      {hint && <dd className="mt-0.5 text-sm text-ink-faint">{hint}</dd>}
    </div>
  );
}
