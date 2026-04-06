"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { StepPills } from "@/components/ui/StepPills";

export default function LoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleHint = searchParams.get("role") || "";

    const [employeeId, setEmployeeId] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const demoCredentials: Record<string, { id: string; pw: string }> = {
        admin: { id: "SEC-ADMIN-001", pw: "admin123" },
        council: { id: "SEC-COUNCIL-001", pw: "council123" },
        "": { id: "SEC-2024-00421", pw: "member123" },
    };

    async function handleSSO() {
        const creds = demoCredentials[roleHint] || demoCredentials[""];
        await doLogin(creds.id, creds.pw);
    }

    async function doLogin(id?: string, pw?: string) {
        setLoading(true);
        setError("");
        const eid = id || employeeId;
        const pass = pw || password;

        if (!eid || !pass) {
            setError("Please enter your Employee ID and password.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employeeId: eid, password: pass }),
            });

            const data = await res.json();
            setLoading(false);

            if (!res.ok) {
                setError(data.error || "Invalid credentials");
                return;
            }

            router.push("/auth/verify");
        } catch {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <StatusBar />
            <div className="max-w-[420px] mx-auto mt-12 px-4">
                <div className="card p-7 rounded-[14px]">
                    <StepPills current={1} />
                    <div className="text-center mb-6">
                        <span className="eyebrow text-samsung-primary block mb-2">Step 1 of 2</span>
                        <h2 className="text-[22px] heading mb-1.5">Sign in to Samsung DAO</h2>
                        <p className="text-[13px] text-gray-500 leading-relaxed">Use your Samsung employee credentials to access the governance portal.</p>
                    </div>
                    <button onClick={handleSSO} disabled={loading}
                        className="w-full py-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2.5 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50">
                        <svg width="20" height="20" viewBox="0 0 26 26" fill="none"><rect width="26" height="26" rx="5" fill="#E8EAFB" /><rect x="4" y="4" width="7" height="7" rx="1.5" fill="#1428A0" fillOpacity="0.9" /><rect x="15" y="4" width="7" height="7" rx="1.5" fill="#1428A0" fillOpacity="0.6" /><rect x="4" y="15" width="7" height="7" rx="1.5" fill="#1428A0" fillOpacity="0.6" /><rect x="15" y="15" width="7" height="7" rx="1.5" fill="#1428A0" fillOpacity="0.4" /></svg>
                        Continue with Samsung SSO
                    </button>
                    <div className="flex items-center gap-3 my-5 text-gray-400 text-xs"><div className="flex-1 h-px bg-gray-200" /><span>or sign in manually</span><div className="flex-1 h-px bg-gray-200" /></div>
                    <div className="flex flex-col gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Employee ID</label>
                            <input type="text" placeholder="e.g. SEC-2024-00421" value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-[13px] font-mono text-gray-700 outline-none focus:border-samsung-primary transition-colors" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Password</label>
                            <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary transition-colors" />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-samsung-primary" />Remember this device
                            </label>
                            <a className="text-xs text-samsung-primary cursor-pointer hover:underline">Forgot password?</a>
                        </div>
                        {error && <div className="bg-danger-light text-danger text-xs rounded-lg px-3 py-2">{error}</div>}
                        <button onClick={() => doLogin()} disabled={loading} className="btn-primary w-full">{loading ? "Signing in…" : "Sign in"}</button>
                    </div>
                    <p className="text-[11px] text-gray-400 text-center mt-5">Samsung Electronics internal system · Unauthorised access is prohibited</p>
                </div>
                <p className="text-center mt-4"><a href="/" className="text-xs text-gray-400 hover:text-gray-500">← Back to homepage</a></p>
            </div>
        </div>
    );
}