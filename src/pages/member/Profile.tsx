import { useAuthStore } from '@/stores/useAuthStore';
import { User, Shield, Briefcase, Calendar, Mail, Tag, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Profile() {
  const { user, wallets } = useAuthStore();

  const primaryWallet = wallets.find((w) => w.is_primary) || wallets[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getHashscanUrl = (accountId: string) => {
    const network = primaryWallet?.network?.toLowerCase().includes('mainnet') ? 'mainnet' : 'testnet';
    return `https://hashscan.io/${network}/account/${accountId}`;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Personal Info */}
        <div className="glass-card rounded-2xl p-8 border border-border/50">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-display text-2xl font-bold">
              {user?.name?.charAt(0) || <User />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{user?.nickname || user?.name || 'Samsung Member'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Employee ID</p>
                <p className="font-mono text-sm">{user?.id?.split('-')[0].toUpperCase() || 'S-1928374'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Corporate Email</p>
                <p className="text-sm">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Department / Region</p>
                <p className="text-sm">{user?.assigned_hq ? user.assigned_hq.split('(')[0].trim() : 'Global R&D'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Role / Type</p>
                <p className="text-sm capitalize inline-flex items-center gap-2">
                  {user?.role?.toLowerCase() || 'member'}
                  <span className="bg-emerald-500/10 text-emerald-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    KYC Verified
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Member Since</p>
                <p className="text-sm">April 2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Wallet Info */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-8 border border-border/50 bg-primary/5">
            <h3 className="font-display text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              Corporate Wallet
              {primaryWallet && (
                <span className="bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest shrink-0">
                  {primaryWallet.network.split('_')[1] || primaryWallet.network}
                </span>
              )}
            </h3>

            {primaryWallet ? (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Hedera Account ID</p>
                  <div className="flex items-center gap-2 bg-background/50 p-2.5 rounded-lg border border-border/50">
                    <p className="font-mono text-sm font-semibold flex-1">{primaryWallet.wallet_address}</p>
                    <button 
                      onClick={() => handleCopy(primaryWallet.wallet_address)}
                      className="text-muted-foreground hover:text-primary transition-colors p-1"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Provider</p>
                    <p className="text-sm font-medium">{primaryWallet.wallet_type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Custody Model</p>
                    <p className="text-sm font-medium">{primaryWallet.is_custodial ? 'Custodial' : 'Self-Custody'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">SPU Token Balance</p>
                  <p className="text-3xl font-mono font-bold text-foreground">
                    240 <span className="text-lg text-muted-foreground font-sans uppercase">spu</span>
                  </p>
                </div>

                <Button 
                  onClick={() => window.open(getHashscanUrl(primaryWallet.wallet_address), '_blank')}
                  className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 mt-2"
                >
                  View on HashScan <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">No corporate wallet provisioned yet.</p>
                <Button variant="outline">Connect Wallet</Button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
