interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  warn?: boolean;
}

export function StatCard({ label, value, delta, warn }: StatCardProps) {
  return (
    <div className="card">
      <div className="text-[11px] text-gray-400 font-medium mb-1.5">{label}</div>
      <div className="text-[20px] sm:text-[22px] font-bold text-gray-900 tracking-tight">{value}</div>
      {delta && (
        <div className={`text-[11px] mt-1 ${warn ? "text-warning" : "text-gray-400"}`}>
          {delta}
        </div>
      )}
    </div>
  );
}