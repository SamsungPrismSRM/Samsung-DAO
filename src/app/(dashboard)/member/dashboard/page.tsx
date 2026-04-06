"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EventCard } from "@/components/ui/EventCard";

interface Election {
  id: string;
  title: string;
  status: string;
  endDate: string;
  eligibleMemberCount: number;
  candidates: { id: string; name: string; department: string; voteCount: number }[];
  _count: { votes: number };
}

interface Proposal {
  id: string;
  number: number;
  title: string;
  status: string;
}

export default function MemberDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [elections, setElections] = useState<Election[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/elections").then((r) => r.json()).then(setElections).catch(() => { });
    fetch("/api/proposals").then((r) => r.json()).then(setProposals).catch(() => { });
  }, []);

  if (loading || !user) return null;

  const liveElection = elections.find((e) => e.status === "LIVE");

  async function castVote() {
    if (!liveElection || !selectedCandidate) return;
    setVoting(true);

    const res = await fetch("/api/elections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ electionId: liveElection.id, candidateId: selectedCandidate }),
    });

    if (res.ok) {
      const updated = await fetch("/api/elections").then((r) => r.json());
      setElections(updated);
      setSelectedCandidate(null);
    } else {
      const err = await res.json();
      alert(err.error || "Failed to cast vote");
    }
    setVoting(false);
  }

  const totalVotes = liveElection?._count?.votes || liveElection?.candidates.reduce((a, c) => a + c.voteCount, 0) || 0;
  const votePercentage = liveElection
    ? ((totalVotes / liveElection.eligibleMemberCount) * 100).toFixed(1)
    : "0";

  const rep = user.reputationScore;
  const repBreakdown = [
    { label: "Participation", pts: Math.round(rep * 0.378) },
    { label: "Proposals", pts: Math.round(rep * 0.331) },
    { label: "Delegation", pts: Math.round(rep * 0.174) },
    { label: "Tenure", pts: Math.round(rep * 0.118) },
  ];

  return (
    <DashboardLayout role="MEMBER">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Reputation score" value={`${user.reputationScore} pts`} delta="+12 this month" />
        <StatCard label="Active votes" value={liveElection ? "1" : "0"} delta={liveElection ? "Ends soon" : "None"} />
        <StatCard label="Proposals created" value={proposals.filter((p) => p.status !== "REJECTED").length} delta={`${proposals.filter((p) => p.status === "APPROVED").length} approved`} />
        <StatCard label="SPU earned" value={user.spuBalance} delta="This period" />
      </div>

      {/* Live Election */}
      {liveElection && (
        <div className="bg-white rounded-xl border-[1.5px] border-samsung-primary p-4 sm:p-5 mb-5">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
            <div>
              <StatusBadge status="live" label="LIVE NOW" />
              <h3 className="text-[16px] sm:text-[17px] heading mt-2 mb-1">{liveElection.title}</h3>
              <p className="text-xs text-gray-500">
                Voting closes: {new Date(liveElection.endDate).toLocaleString("en-KR")} ·{" "}
                {liveElection.eligibleMemberCount} eligible · {totalVotes} votes cast ({votePercentage}%)
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {liveElection.candidates.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCandidate(c.id)}
                className={`flex items-center justify-between px-3 sm:px-3.5 py-2.5 rounded-lg border-thin cursor-pointer transition-colors ${selectedCandidate === c.id
                    ? "bg-samsung-light border-samsung-primary"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-samsung-light flex items-center justify-center text-xs font-semibold text-samsung-primary shrink-0">
                    {c.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-gray-700 truncate">{c.name}</div>
                    <div className="text-[11px] text-gray-400">{c.department}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="font-mono text-[11px] sm:text-xs text-gray-500">{c.voteCount}</span>
                  <div
                    className={`w-[18px] h-[18px] rounded-full border-[1.5px] transition-colors ${selectedCandidate === c.id
                        ? "border-samsung-primary bg-samsung-primary"
                        : "border-samsung-primary"
                      }`}
                  >
                    {selectedCandidate === c.id && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={castVote}
            disabled={!selectedCandidate || voting}
            className="btn-primary w-full"
          >
            {voting ? "Casting vote…" : "Cast vote"}
          </button>
        </div>
      )}

      {/* Proposals + Reputation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="card">
          <h4 className="text-sm heading mb-3">Recent Proposals</h4>
          {proposals.slice(0, 5).map((p) => (
            <div key={p.id} className="flex justify-between items-center gap-2 py-2 border-b border-thin border-gray-200 last:border-b-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[11px] text-gray-400 font-medium shrink-0">P-{p.number}</span>
                <span className="text-[13px] text-gray-700 truncate">{p.title}</span>
              </div>
              <StatusBadge status={p.status.toLowerCase()} />
            </div>
          ))}
          <button
            onClick={() => router.push("/member/proposals")}
            className="mt-3 w-full py-2 rounded-lg bg-samsung-light text-samsung-primary text-xs font-semibold"
          >
            + Create new proposal
          </button>
        </div>

        <div className="card">
          <h4 className="text-sm heading mb-3">My Reputation</h4>
          {repBreakdown.map((r) => (
            <div key={r.label} className="flex justify-between py-1.5 border-b border-thin border-gray-200 last:border-b-0">
              <span className="text-[13px] text-gray-500">{r.label}</span>
              <span className="font-mono text-xs text-gray-700 font-medium">{r.pts} pts</span>
            </div>
          ))}
          <div className="flex justify-between pt-2.5 mt-1 border-t border-gray-200">
            <span className="text-[13px] font-semibold text-gray-900">Total</span>
            <span className="font-mono text-sm font-bold text-samsung-primary">{rep} pts</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-2">Decay rate: -5 pts/month if inactive</div>
        </div>
      </div>

      {/* Events */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <EventCard type="Lottery" title="Q2 Samsung SPU Lottery" detail="Draws: 15 Apr · 500 SPU prize" actionLabel="Enter now" />
        <EventCard type="Giveaway" title="PRISM Research Giveaway" detail="Closes: 20 Apr" actionLabel="Registered" registered />
      </div>
    </DashboardLayout>
  );
}