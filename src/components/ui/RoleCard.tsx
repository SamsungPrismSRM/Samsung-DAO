"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  buttonLabel: string;
  href: string;
  accent: string;
  primary?: boolean;
  badge?: string;
}

export function RoleCard({ icon, title, description, features, buttonLabel, href, accent, primary = false, badge }: RoleCardProps) {
  return (
    <div className={`flex-1 min-w-[260px] bg-white rounded-xl p-5 sm:p-6 flex flex-col gap-4 relative transition-all hover:-translate-y-0.5 ${primary ? "border-[1.5px] border-samsung-primary" : "border border-gray-200 hover:border-gray-300"
      }`}>
      {badge && (
        <span className="absolute -top-2.5 right-4 bg-samsung-primary text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wide">{badge}</span>
      )}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}12` }}>{icon}</div>
      <div>
        <h3 className="text-[17px] heading">{title}</h3>
        <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {features.map(f => (
          <div key={f} className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
            <span className="text-[13px] text-gray-700">{f}</span>
          </div>
        ))}
      </div>
      <Link href={href} className={`w-full text-center py-2.5 rounded-lg text-[13px] font-semibold transition-colors no-underline ${primary ? "bg-samsung-primary text-white hover:bg-samsung-dark" : "bg-transparent border border-gray-200 text-gray-700 hover:border-gray-300"
        }`} style={!primary ? { borderColor: `${accent}40`, color: accent } : {}}>{buttonLabel}</Link>
    </div>
  );
}