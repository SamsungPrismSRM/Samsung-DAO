"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CheckCircle, AlertCircle } from "lucide-react";

interface UserProfile {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  role: string;
  memberType: string;
  kycVerified: boolean;
  walletBound: boolean;
  walletProvider: string | null;
  hederaAccountId: string | null;
  reputationScore: number;
  spuBalance: number;
  createdAt: string;
  _count: { proposals: number; votes: number };
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setProfile).catch(() => { });
  }, []);

  if (!user || !profile) return null;

  return (
    <DashboardLayout role="MEMBER">
      <h2 className="text-xl heading mb-5">My Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Identity */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-sm heading mb-3">Identity</h3>
          <div className="flex flex-col gap-2.5">
            <ProfileRow label="Name" value={profile.name} />
            <ProfileRow label="Employee ID" value={profile.employeeId} mono />
            <ProfileRow label="Email" value={profile.email} />
            <ProfileRow label="Department" value={profile.department} />
            <ProfileRow label="Role" value={profile.role.toLowerCase()} badge />
            <ProfileRow label="Member type" value={profile.memberType.toLowerCase()} badge />
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-gray-400">KYC status</span>
              <span className="flex items-center gap-1 text-xs">
                {profile.kycVerified ? (
                  <><CheckCircle className="w-3.5 h-3.5 text-success" /><span className="text-success font-medium">Verified</span></>
                ) : (
                  <><AlertCircle className="w-3.5 h-3.5 text-warning" /><span className="text-warning font-medium">Pending</span></>
                )}
              </span>
            </div>
            <ProfileRow label="Member since" value={new Date(profile.createdAt).toLocaleDateString()} />
          </div>
        </div>

        {/* Wallet */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-sm heading mb-3">Hedera Wallet</h3>
          {profile.walletBound ? (
            <div className="flex flex-col gap-2.5">
              <div className="bg-success-light rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-green-800 mb-2">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                Wallet connected
              </div>
              <ProfileRow label="Account ID" value={profile.hederaAccountId || ""} mono />
              <ProfileRow label="Provider" value={profile.walletProvider || "unknown"} />
              <ProfileRow label="Network" value="Hedera Testnet" />
              <ProfileRow label="SPU Balance" value={`${profile.spuBalance} SPU`} mono />
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">Wallet not connected</p>
              <button onClick={() => router.push("/auth/wallet")} className="btn-primary text-sm">
                Connect wallet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Activity */}
      <div className="card p-4 sm:p-5">
        <h3 className="text-sm heading mb-3">Activity Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{profile.reputationScore}</div>
            <div className="text-[11px] text-gray-400 mt-1">Reputation pts</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{profile._count.proposals}</div>
            <div className="text-[11px] text-gray-400 mt-1">Proposals</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{profile._count.votes}</div>
            <div className="text-[11px] text-gray-400 mt-1">Votes cast</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{profile.spuBalance}</div>
            <div className="text-[11px] text-gray-400 mt-1">SPU earned</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProfileRow({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1 gap-2">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      {badge ? (
        <span className="font-mono text-[10px] font-semibold text-samsung-primary bg-samsung-light px-2 py-0.5 rounded capitalize">
          {value}
        </span>
      ) : (
        <span className={`text-xs text-gray-700 text-right truncate ${mono ? "font-mono font-medium" : ""}`}>{value}</span>
      )}
    </div>
  );
}