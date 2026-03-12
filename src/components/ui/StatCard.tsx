interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
}

export function StatCard({ label, value, icon, loading }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
      <div className="flex-shrink-0 p-3 rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
        {icon}
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-20 bg-[var(--surface)] rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-semibold text-[var(--heading)]">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        )}
        <p className="text-sm text-[var(--muted)]">{label}</p>
      </div>
    </div>
  );
}
