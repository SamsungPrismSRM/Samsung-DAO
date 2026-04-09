import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Key, Globe, Building2, Check, Wallet } from 'lucide-react';

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <motion.div
        key="role-select"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl gradient-primary">
            <span className="text-xl font-bold text-primary-foreground">S</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Welcome to Samsung Members DAO</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose your role to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Member Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/auth/member')}
            className="glass-card rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Samsung Member</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Community</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-3.5 w-3.5 text-emerald-500/60" />
                <span>Non-custodial wallet via <span className="font-semibold text-foreground">MetaMask</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500/60" />
                <span>Community signaling votes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500/60" />
                <span>Forum participation & proposals</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500/60" />
                <span>Lottery & reward eligibility</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <span className="text-xs font-medium text-emerald-600">You control your keys</span>
              <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </div>
          </motion.div>

          {/* Council Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/auth/council')}
            className="glass-card rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-blue-500/40 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-3 right-3">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">Enterprise</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Samsung Council</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Governance</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="h-3.5 w-3.5 text-blue-500/60" />
                <span>Custodial wallet via <span className="font-semibold text-foreground">DFNS</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-3.5 w-3.5 text-blue-500/60" />
                <span>Shared key across <span className="font-semibold text-foreground">15 Regional HQs</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 text-blue-500/60" />
                <span>Multi-sig governance (8/15 threshold)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-blue-500/60" />
                <span>Treasury & execution authority</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <span className="text-xs font-medium text-blue-600">Enterprise-grade security</span>
              <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </div>
          </motion.div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to Samsung Members DAO Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
