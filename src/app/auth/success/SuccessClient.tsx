"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { StepPills } from "@/components/ui/StepPills";
import { CheckCircle } from "lucide-react";

export default function SuccessClient() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useSearchParams();

    const accountId =
        params.get("accountId") ||
        user?.hederaAccountId ||
        "0.0.XXXXXX";
    const provider = params.get("provider") || "hashpack";

    const dashboardPath =
        user?.role === "ADMIN"
            ? "/admin/dashboard"
            : user?.role === "COUNCIL"
                ? "/council/dashboard"
                : "/member/dashboard";

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <StatusBar />
            <div className="max-w-[420px] mx-auto mt-12 px-4">
                <div className="card p-7 rounded-[14px]">
                    <StepPills current={2} done={[1, 2]} />
                    <div className="text-center mb-5">
                        <span className="eyebrow text-samsung-primary block mb-2">
                            Setup complete
                        </span>
                        <h2 className="text-[22px] heading mb-1.5">
                            You're all set
                        </h2>
                        <p className="text-[13px] text-gray-500 leading-relaxed">
                            Wallet binding saved — you won't need to do this again.
                        </p>
                    </div>
                    <div className="bg-success-light rounded-xl px-3.5 py-3 text-[13px] text-green-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                        Connected — {provider} · Hedera Testnet
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 font-mono text-xs mb-4">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-400">Account ID:</span>
                            <span className="text-gray-900 font-semibold">
                                {accountId}
                            </span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-400">Member:</span>
                            <span className="text-gray-700">{user?.name}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-400">Role:</span>
                            <span className="font-semibold text-samsung-primary bg-samsung-light px-2 py-0.5 rounded capitalize">
                                {user?.role?.toLowerCase()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">SPU balance:</span>
                            <span className="text-gray-500">
                                {user?.spuBalance || 0} SPU testnet
                            </span>
                        </div>
                    </div>
                    <div className="bg-samsung-light rounded-xl px-3.5 py-3 text-[13px] text-samsung-dark mb-5 leading-relaxed">
                        Next time, only Samsung SSO is needed. Wallet already bound.
                    </div>
                    <button
                        onClick={() => router.push(dashboardPath)}
                        className="btn-primary w-full"
                    >
                        Go to my dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}