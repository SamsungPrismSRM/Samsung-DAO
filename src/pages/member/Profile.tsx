import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { User, Shield, Briefcase, Calendar, Mail, Tag, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { memberApi } from '@/lib/memberApi';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletStore } from '@/stores/useWalletStore';
import { connectMemberMetaMask } from '@/lib/memberWalletConnect';
import { isMetaMaskInstalled } from '@/lib/metamask';

type ProfilePayload = {
  id: string;
  name: string;
  nickname: string | null;
  email: string;
  department: string | null;
  role: string;
  assigned_hq: string | null;
  memberSince: string;
  kycVerified: boolean;
  wallet: {
    connected: boolean;
    hederaAccountId: string | null;
    walletType: string | null;
    spuBalance: string;
    hbarBalance: string | null;
  };
  stats: { votingPower: number; proposals: number; votes: number };
};

export default function Profile() {
  const { user } = useAuthStore();
  const { connect } = useWalletStore();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletBusy, setWalletBusy] = useState(false);

  const loadProfile = async () => {
    try {
      const { data } = await memberApi.get<ProfilePayload>('/user/profile');
      setProfile(data);
    } catch {
      toast.error('Could not load profile');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadProfile();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryWallet = profile?.wallet;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleMetaMask = async () => {
    setWalletBusy(true);
    try {
      if (!isMetaMaskInstalled()) {
        toast.error('MetaMask not detected', {
          description: 'Install MetaMask to connect your wallet.',
          action: {
            label: 'Install',
            onClick: () => window.open('https://metamask.io/download/', '_blank'),
          },
        });
        return;
      }
      const { address } = await connectMemberMetaMask();
      connect(address, 'METAMASK');
      await loadProfile();
      toast.success('MetaMask connected', { description: address });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setWalletBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const walletLabel =
    primaryWallet?.hederaAccountId && primaryWallet.hederaAccountId.startsWith('0x')
      ? 'Wallet address'
      : 'Linked account';

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-8 border border-border/50">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-display text-2xl font-bold">
              {(profile?.name || user?.name)?.charAt(0) || <User />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {profile?.nickname || profile?.name || user?.nickname || user?.name || 'Member'}
              </h2>
              <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Employee ID</p>
                <p className="font-mono text-sm">{(profile?.id || user?.id || '').slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Corporate Email</p>
                <p className="text-sm">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Department</p>
                <p className="text-sm">
                  {profile?.department ||
                    profile?.assigned_hq ||
                    user?.assigned_hq?.split('(')[0]?.trim() ||
                    '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Role</p>
                <p className="text-sm capitalize inline-flex items-center gap-2">
                  {(profile?.role || user?.role || 'member').toLowerCase()}
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      profile?.kycVerified
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-amber-500/10 text-amber-700'
                    }`}
                  >
                    {profile?.kycVerified ? 'KYC Verified' : 'KYC Pending'}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Member Since</p>
                <p className="text-sm">
                  {profile?.memberSince
                    ? new Date(profile.memberSince).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-8 border border-border/50 bg-primary/5">
            <h3 className="font-display text-lg font-bold text-foreground mb-6 flex items-center gap-2 flex-wrap">
              MetaMask · Hedera testnet
              {primaryWallet?.connected && (
                <span className="bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest shrink-0">
                  Connected
                </span>
              )}
            </h3>

            {primaryWallet?.connected && primaryWallet.hederaAccountId ? (
              <div className="space-y-6">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                  Wallet connected
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">{walletLabel}</p>
                  <div className="flex items-center gap-2 bg-background/50 p-2.5 rounded-lg border border-border/50">
                    <p className="font-mono text-sm font-semibold flex-1 truncate break-all">
                      {primaryWallet.hederaAccountId}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(primaryWallet.hederaAccountId!)}
                      className="text-muted-foreground hover:text-primary transition-colors p-1 shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Provider</p>
                    <p className="text-sm font-medium">
                      {primaryWallet.walletType === 'METAMASK' ? 'MetaMask' : primaryWallet.walletType}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Network</p>
                    <p className="text-sm font-medium">Hedera Testnet</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 space-y-2">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">SPU (rewards)</p>
                  <p className="text-3xl font-mono font-bold text-foreground">
                    {profile?.wallet.spuBalance ?? '0'}{' '}
                    <span className="text-lg text-muted-foreground font-sans uppercase">spu</span>
                  </p>
                  {primaryWallet.hbarBalance != null && (
                    <p className="text-xs text-muted-foreground">
                      HBAR (mirror): {primaryWallet.hbarBalance} ℏ
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                {!isMetaMaskInstalled() && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-200">Install MetaMask to link your wallet.</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Connect MetaMask on Hedera testnet and sign the verification message.
                </p>
                <Button disabled={walletBusy} onClick={handleMetaMask} className="w-full sm:w-auto">
                  {walletBusy ? 'Connecting…' : 'Connect MetaMask'}
                </Button>
              </div>
            )}
          </div>

          {profile?.stats && (
            <div className="glass-card rounded-xl p-6 border border-border/50">
              <h4 className="text-sm font-bold text-foreground mb-4">Activity summary</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{profile.stats.votingPower}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Reputation pts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{profile.stats.proposals}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Proposals</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{profile.stats.votes}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Votes cast</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{profile.wallet.spuBalance}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">SPU earned</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
