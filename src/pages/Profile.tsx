import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { toast } from 'sonner';
import { getProfile, type ProfileApiResponse } from '@/services/profileService';
import { Button } from '@/components/ui/button';
import { LogOut, Wallet, Loader2, BadgeCheck, ExternalLink } from 'lucide-react';
import { hashscanTestnetAccountUrl } from '@/lib/hederaMirror';

const POLL_MS = 5000;
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api/v1';

function MirrorAccountLink({ value, label }: { value: string; label: string }) {
  const href = hashscanTestnetAccountUrl(value);
  if (!href) {
    return (
      <span className="font-mono text-xs text-foreground break-all text-right" title={label}>
        {value}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`View ${label} on HashScan (testnet)`}
      className="group inline-flex max-w-full flex-col items-end gap-0.5 text-right sm:flex-row sm:items-center sm:gap-1.5"
    >
      <span className="font-mono text-xs text-primary underline decoration-primary/40 underline-offset-2 transition-colors group-hover:text-primary/90 group-hover:decoration-primary">
        {value}
      </span>
      <ExternalLink className="hidden h-3 w-3 shrink-0 text-primary opacity-70 group-hover:opacity-100 sm:inline" aria-hidden />
    </a>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { token, isAuthenticated, logout, isHydrated, setWallets } = useAuthStore();
  const { connect: connectWalletStore } = useWalletStore();
  const [profile, setProfile] = useState<ProfileApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hashPackBusy, setHashPackBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await getProfile();
      setProfile(data);
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      if (err.status === 401) {
        logout();
        navigate('/auth');
        return;
      }
      if (err.status === 404) {
        setError('User not initialized');
        setProfile(null);
        return;
      }
      setError(err.message ?? 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    if (!isHydrated) return;
    load();
  }, [isHydrated, load]);

  useEffect(() => {
    if (!token || !isHydrated) return;
    const interval = setInterval(() => {
      getProfile()
        .then(setProfile)
        .catch(() => {
          /* keep last good profile on transient errors */
        });
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [token, isHydrated]);

  const displayName = profile?.name || profile?.alias || profile?.email?.split('@')[0] || 'Member';
  const roleLabel = profile?.role === 'COUNCIL' ? 'Council' : profile?.role === 'ADMIN' ? 'Admin' : 'Member';
  const hqLine = profile?.hq ? `${roleLabel} · ${profile.hq}` : roleLabel;

  const handleConnectHashPack = async () => {
    if (!token) return;
    setHashPackBusy(true);
    try {
      const { pairHashPackAndSignBindingMessage } = await import('@/lib/hashpackConnect');
      const { accountId, message, signatureHex } = await pairHashPackAndSignBindingMessage();
      const res = await fetch(`${API_BASE}/wallet/hashpack/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_id: accountId,
          message,
          signature_hex: signatureHex,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body?.error === 'string' ? body.error : 'Could not link HashPack');
      }
      connectWalletStore(accountId, 'HASHPACK');
      const walletRes = await fetch(`${API_BASE}/wallet/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (walletRes.ok) {
        const w = await walletRes.json();
        setWallets(w.wallets ?? []);
      }
      await load();
      toast.success('HashPack connected', { description: `Linked ${accountId}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'HashPack connection failed';
      toast.error('HashPack', { description: msg });
    } finally {
      setHashPackBusy(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {!isHydrated || loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isHydrated && !token ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to view your profile.</p>
            <Button onClick={() => navigate('/auth')}>Go to sign in</Button>
          </div>
        ) : error && !profile ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-destructive mb-2">{error}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error === 'User not initialized'
                ? 'Your account is not in the database yet. Complete onboarding from the home flow.'
                : 'Complete onboarding or council login first.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/auth')}>
              Sign in
            </Button>
          </div>
        ) : profile ? (
          <>
            <div className="glass-card rounded-xl p-8 text-center mb-6">
              <UserAvatar name={displayName} size="lg" className="mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold text-foreground">{displayName}</h1>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <p className="mt-1 text-xs text-primary font-medium">{hqLine}</p>
            </div>

            <div className="glass-card rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Wallet</h2>
                {profile.wallet.connected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    <BadgeCheck className="h-3 w-3" /> Connected
                  </span>
                )}
              </div>
              {profile.wallet.connected && profile.wallet.hederaAccountId ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm gap-2 items-start">
                    <span className="text-muted-foreground shrink-0 pt-0.5">Hedera</span>
                    <MirrorAccountLink value={profile.wallet.hederaAccountId} label="account" />
                  </div>
                  <div className="flex justify-between text-sm gap-2 items-baseline">
                    <span className="text-muted-foreground shrink-0">HBAR (testnet)</span>
                    <span className="text-right font-semibold tabular-nums text-foreground">
                      {profile.wallet.hbarBalance != null
                        ? `${profile.wallet.hbarBalance} ℏ`
                        : '—'}
                    </span>
                  </div>
                  {profile.wallet.dfnsWalletId && (
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-muted-foreground shrink-0">DFNS</span>
                      <span className="font-mono text-xs text-foreground break-all text-right">
                        {profile.wallet.dfnsWalletId}
                      </span>
                    </div>
                  )}
                  {profile.wallet.source && (
                    <p className="text-[10px] text-muted-foreground pt-1">
                      Source: {profile.wallet.source === 'hq_treasury' ? 'Council treasury (HQ)' : 'Linked wallet'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No wallet connected</p>
                  {profile.role === 'COUNCIL' ? (
                    <Button className="w-full gap-2" onClick={() => navigate('/auth/council')}>
                      <Wallet className="h-4 w-4" />
                      Create or link council wallet
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        disabled={hashPackBusy}
                        onClick={handleConnectHashPack}
                      >
                        {hashPackBusy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Connecting HashPack…
                          </>
                        ) : (
                          <>
                            <Wallet className="h-4 w-4" />
                            Connect wallet
                          </>
                        )}
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                        Uses HashConnect: in the WalletConnect window, choose <strong>HashPack</strong> (browser
                        extension). Requires <code className="text-[9px]">VITE_WALLETCONNECT_PROJECT_ID</code> in{' '}
                        <code className="text-[9px]">.env</code>.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="glass-card rounded-xl p-6 mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Governance Stats</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-foreground">{profile.stats.votingPower.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Voting Power</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{profile.stats.proposals}</p>
                  <p className="text-xs text-muted-foreground">Proposals</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{profile.stats.votes}</p>
                  <p className="text-xs text-muted-foreground">Votes Cast</p>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={() => { logout(); navigate('/'); }}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}
