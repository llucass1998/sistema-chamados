interface MetricCardProps {
  label: string;
  value: number;
  tone?: 'default' | 'blue' | 'amber' | 'emerald' | 'red';
}

const toneClasses: Record<NonNullable<MetricCardProps['tone']>, string> = {
  default: 'border-slate-200 bg-white text-slate-950',
  blue: 'border-sky-200 bg-sky-50 text-sky-950',
  amber: 'border-amber-200 bg-amber-50 text-amber-950',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  red: 'border-red-200 bg-red-50 text-red-950',
};

function MetricCard({ label, value, tone = 'default' }: MetricCardProps) {
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
      <strong className="mt-3 block text-3xl font-black tracking-tight">{value}</strong>
    </div>
  );
}

export default MetricCard;
