interface MetricCardProps {
  label: string;
  value: number;
  tone?: 'default' | 'blue' | 'amber' | 'emerald' | 'red';
}

const toneClasses: Record<NonNullable<MetricCardProps['tone']>, { accent: string; text: string }> = {
  default: { accent: 'bg-slate-400', text: 'text-slate-950' },
  blue: { accent: 'bg-blue-600', text: 'text-blue-950' },
  amber: { accent: 'bg-amber-500', text: 'text-amber-950' },
  emerald: { accent: 'bg-emerald-500', text: 'text-emerald-950' },
  red: { accent: 'bg-red-500', text: 'text-red-950' },
};

function MetricCard({ label, value, tone = 'default' }: MetricCardProps) {
  const toneStyle = toneClasses[tone];

  return (
    <div className="enterprise-card group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300">
      <span className={`absolute left-0 top-0 h-full w-1 ${toneStyle.accent}`} />
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${toneStyle.accent}`} />
      </div>
      <strong className={`mt-4 block text-3xl font-black tracking-tight ${toneStyle.text}`}>{value}</strong>
    </div>
  );
}

export default MetricCard;
