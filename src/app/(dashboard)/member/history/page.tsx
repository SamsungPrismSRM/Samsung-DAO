"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Vote, FileText, Gift, Ticket, Users } from "lucide-react";

interface HistoryItem {
  id: string;
  type: "vote" | "proposal" | "giveaway" | "lottery" | "delegation";
  title: string;
  detail: string;
  timestamp: string;
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/proposals").then(r => r.json()).then(setProposals).catch(() => { });
    fetch("/api/events").then(r => r.json()).then(setEvents).catch(() => { });
  }, []);

  if (loading || !user) return null;

  // Build history from real data
  const history: HistoryItem[] = [
    ...proposals.map(p => ({
      id: `prop-${p.id}`,
      type: "proposal" as const,
      title: `Proposal P-${p.number}: ${p.title}`,
      detail: `Status: ${p.status.toLowerCase()}`,
      timestamp: p.createdAt,
    })),
    ...events.filter((e: any) => e.userEntered).map((e: any) => ({
      id: `event-${e.id}`,
      type: e.type === "LOTTERY" ? "lottery" as const : "giveaway" as const,
      title: e.title,
      detail: `Entered · Prize: ${e.prize}`,
      timestamp: e.createdAt,
    })),
    // Static entries for demo
    { id: "h-vote-1", type: "vote" as const, title: "Voted in Council Election — Q1 2025", detail: "Candidate: Park Soo-yeon", timestamp: "2025-01-15T10:30:00" },
    { id: "h-vote-2", type: "vote" as const, title: "Voted on Proposal P-8", detail: "Vote: Approve", timestamp: "2025-03-20T14:00:00" },
    { id: "h-del-1", type: "delegation" as const, title: "Received delegation from Han Ji-min", detail: "Active delegation", timestamp: "2025-03-10T09:00:00" },
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const iconMap = {
    vote: { icon: Vote, color: "text-samsung-primary", bg: "bg-samsung-light" },
    proposal: { icon: FileText, color: "text-warning", bg: "bg-warning-light" },
    giveaway: { icon: Gift, color: "text-success", bg: "bg-success-light" },
    lottery: { icon: Ticket, color: "text-samsung-mid", bg: "bg-samsung-light" },
    delegation: { icon: Users, color: "text-samsung-primary", bg: "bg-samsung-light" },
  };

  return (
    <DashboardLayout role="MEMBER">
      <h2 className="text-xl heading mb-1">History</h2>
      <p className="text-xs text-gray-400 mb-5">Your complete activity timeline</p>

      <div className="card">
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No activity yet.</p>
        ) : history.map((item, i) => {
          const { icon: Icon, color, bg } = iconMap[item.type];
          return (
            <div key={item.id} className={`flex items-start gap-3 py-3.5 px-4 ${i < history.length - 1 ? "border-b border-thin border-gray-200" : ""}`}>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-gray-700">{item.title}</div>
                <div className="text-[11px] text-gray-400">{item.detail}</div>
              </div>
              <div className="text-[11px] text-gray-400 font-mono shrink-0">
                {new Date(item.timestamp).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
