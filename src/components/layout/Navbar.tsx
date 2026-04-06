"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";

function SamsungLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect width="26" height="26" rx="5" fill="white" fillOpacity="0.15" />
      <rect x="4" y="4" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.9" />
      <rect x="15" y="4" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.6" />
      <rect x="4" y="15" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.6" />
      <rect x="15" y="15" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.4" />
    </svg>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleBadge =
    user?.role === "ADMIN"
      ? "Admin · Monitor"
      : user?.role === "COUNCIL"
        ? "Council"
        : "";

  return (
    <nav className="h-[52px] bg-samsung-primary flex items-center justify-between px-4 sm:px-6 relative z-50">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-2 sm:gap-2.5 no-underline">
        <SamsungLogo />
        <span className="text-white font-semibold text-[14px] sm:text-[15px] tracking-tight">
          Samsung DAO
        </span>
        <span className="text-white/50 text-[13px] ml-1 hidden sm:inline">
          Governance Portal
        </span>
      </Link>

      {/* Right: Desktop */}
      <div className="hidden md:flex items-center gap-3">
        <span className="font-mono text-[11px] text-white/70 bg-white/10 px-2.5 py-0.5 rounded-md tracking-wide font-medium">
          {roleBadge ? `${roleBadge} · ` : ""}PRISM · Testnet
        </span>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
              {user.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")}
            </div>
            <span className="text-white text-[13px] font-medium">{user.name}</span>
            <button
              onClick={async () => {
                await logout();
                window.location.href = "/";
              }}
              className="text-white/40 hover:text-white/70 text-xs ml-2 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Right: Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden text-white p-1"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="absolute top-[52px] left-0 right-0 bg-samsung-primary border-t border-white/10 p-4 flex flex-col gap-3 md:hidden shadow-lg z-50">
          <span className="font-mono text-[11px] text-white/70 bg-white/10 px-2.5 py-1 rounded-md tracking-wide font-medium w-fit">
            {roleBadge ? `${roleBadge} · ` : ""}PRISM · Testnet
          </span>
          {user && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
                  {user.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>
                <span className="text-white text-[13px] font-medium">
                  {user.name}
                </span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  window.location.href = "/";
                }}
                className="text-white/60 hover:text-white text-xs text-left transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}