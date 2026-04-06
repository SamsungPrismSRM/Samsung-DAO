import { StatusBadge } from "./StatusBadge";

interface ProposalRowProps {
  number: number;
  title: string;
  status: string;
  author?: string;
  daysAgo?: string;
  showAuthor?: boolean;
}

export function ProposalRow({ number, title, status, author, daysAgo, showAuthor }: ProposalRowProps) {
  return (
    <div className="flex justify-between items-start sm:items-center gap-2 py-2 border-b border-thin border-gray-200 last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-gray-400 font-medium shrink-0">P-{number}</span>
          <span className="text-[13px] text-gray-700 truncate">{title}</span>
        </div>
        {showAuthor && author && (
          <span className="text-[11px] text-gray-400">{author}{daysAgo ? ` · ${daysAgo}` : ""}</span>
        )}
      </div>
      <StatusBadge status={status} />
    </div>
  );
}