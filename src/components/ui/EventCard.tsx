interface EventCardProps {
  type: string;
  title: string;
  detail: string;
  actionLabel: string;
  registered?: boolean;
}

export function EventCard({ type, title, detail, actionLabel, registered }: EventCardProps) {
  return (
    <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <span className="eyebrow">{type}</span>
        <div className="text-sm font-semibold text-gray-900 mt-1">{title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{detail}</div>
      </div>
      <button className={`text-xs font-semibold px-3.5 py-1.5 rounded-md shrink-0 w-full sm:w-auto ${registered ? "bg-success-light text-success" : "bg-samsung-light text-samsung-primary"
        }`}>
        {actionLabel}
      </button>
    </div>
  );
}