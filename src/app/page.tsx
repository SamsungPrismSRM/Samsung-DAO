import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { CheckCircle, Shield, Users, User } from "lucide-react";

function RoleCard({
  icon,
  title,
  description,
  features,
  buttonLabel,
  href,
  accent,
  primary = false,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  buttonLabel: string;
  href: string;
  accent: string;
  primary?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`flex-1 min-w-[260px] bg-white rounded-xl p-5 sm:p-6 flex flex-col gap-4 relative transition-all hover:-translate-y-0.5 ${primary
          ? "border-[1.5px] border-samsung-primary"
          : "border-thin border-gray-200 hover:border-gray-300"
        }`}
    >
      {badge && (
        <span className="absolute -top-2.5 right-4 bg-samsung-primary text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wide">
          {badge}
        </span>
      )}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${accent}12` }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-[17px] heading">{title}</h3>
        <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
            <span className="text-[13px] text-gray-700">{f}</span>
          </div>
        ))}
      </div>
      <Link
        href={href}
        className={`w-full text-center py-2.5 rounded-lg text-[13px] font-semibold transition-colors no-underline ${primary
            ? "bg-samsung-primary text-white hover:bg-samsung-dark"
            : "bg-transparent border border-gray-200 text-gray-700 hover:border-gray-300"
          }`}
        style={!primary ? { borderColor: `${accent}40`, color: accent } : {}}
      >
        {buttonLabel}
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <StatusBar />

      {/* Hero */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 max-w-[960px] mx-auto text-center">
        <span className="eyebrow text-samsung-primary">SAMSUNG PRISM · DAO GOVERNANCE</span>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mt-3 mb-4 leading-tight">
          Decentralised governance for Samsung employees
        </h1>
        <p className="text-[14px] sm:text-[15px] text-gray-500 max-w-[580px] mx-auto leading-relaxed">
          Participate in elections, proposals, and giveaways powered by Hedera blockchain.
          Secure, transparent, and built for Samsung&apos;s internal ecosystem.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:flex sm:justify-center gap-4 sm:gap-8 mt-8 py-4 border-y border-thin border-gray-200">
          {[
            { value: "3", label: "Portal roles" },
            { value: "HTS", label: "Token standard" },
            { value: "48h", label: "Timelock window" },
            { value: "3-of-5", label: "Multisig council" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-[13px] font-semibold text-samsung-primary">{s.value}</span>
              <span className="text-[11px] text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Role Cards */}
      <section className="px-4 sm:px-6 pb-12 max-w-[960px] mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          <RoleCard
            icon={<Shield className="w-5 h-5 text-danger" />}
            title="Admin"
            description="Monitor platform activity, review proposals, and oversee governance health."
            features={["Live governance analytics", "Member registry oversight", "Contract event logs", "Anomaly detection alerts"]}
            buttonLabel="Admin login"
            href="/auth/login?role=admin"
            accent="#E24B4A"
          />
          <RoleCard
            icon={<Users className="w-5 h-5 text-samsung-mid" />}
            title="Council member"
            description="Configure governance rules, set up elections, voting parameters, and giveaways."
            features={["Governance rule builder", "Election & voting setup", "Lottery / giveaway config", "Proposal review queue"]}
            buttonLabel="Council login"
            href="/auth/login?role=council"
            accent="#4A5BD4"
          />
          <RoleCard
            icon={<User className="w-5 h-5 text-samsung-primary" />}
            title="Standard member"
            description="Proposers and delegates — participate in elections, create events, and join giveaways."
            features={["Create proposals (Proposer)", "Delegate voting power", "Vote in elections", "Join lottery & giveaway"]}
            buttonLabel="Member login"
            href="/auth/login"
            accent="#1428A0"
            primary
            badge="Most common"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-5 px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span className="text-xs text-white/50">Samsung DAO · PRISM Research · Hedera Testnet</span>
        <span className="font-mono text-[11px] text-white/35">© 2025 Samsung Electronics · Internal use only</span>
      </footer>
    </div>
  );
}