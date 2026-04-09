import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { toast } from 'sonner';
import { Users, ArrowLeft, Loader2, Wallet, AlertTriangle } from 'lucide-react';
import { authenticateWithMetaMask, isMetaMaskInstalled, addHederaTestnet } from '@/lib/metamask';

type MemberStep = 'member-auth' | 'member-wallet';

const API_BASE = 'http://localhost:3001/api/v1';

export default function MemberLogin() {
  const [step, setStep] = useState<MemberStep>('member-auth');
  const [isLoading, setIsLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  
  const navigate = useNavigate();
  const { login, updateUser, setWallets } = useAuthStore();
  const { connect } = useWalletStore();

  const handleMemberLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      console.log("TOKEN:", token);

      if (!token || token.length < 100) {
        throw new Error("Invalid or missing Firebase token.");
      }
      
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("BACKEND ERROR:", errorText);
        throw new Error(errorText);
      }
      const data = await response.json();
      const user = data.user;
      
      login(token, user);

      // Onboard if needed
      if (!user.nickname) {
        if (!nickname.trim()) {
          setIsLoading(false);
          return;
        }
        const onboardRes = await fetch(`${API_BASE}/auth/onboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ nickname, role: 'MEMBER' })
        });
        if (onboardRes.ok) {
          const d = await onboardRes.json();
          updateUser(d.user);
        }
      }

      // Check if user already has a wallet
      const walletRes = await fetch(`${API_BASE}/wallet/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        if (walletData.wallets && walletData.wallets.length > 0) {
          const primaryWallet = walletData.wallets.find((w: any) => w.is_primary) || walletData.wallets[0];
          setWallets(walletData.wallets);
          connect(primaryWallet.wallet_address, 'METAMASK');
          toast.success('Welcome back! Wallet restored.');
          navigate('/dashboard');
          return;
        }
      }

      // No wallet — show MetaMask connect step
      setStep('member-wallet');
    } catch (error: any) {
      console.error(error);
      toast.error('Authentication failed', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetaMaskConnect = async () => {
    setIsLoading(true);
    try {
      if (!isMetaMaskInstalled()) {
        toast.error('MetaMask not detected', {
          description: 'Please install MetaMask browser extension to continue.',
          action: {
            label: 'Install',
            onClick: () => window.open('https://metamask.io/download/', '_blank')
          }
        });
        setIsLoading(false);
        return;
      }

      await addHederaTestnet();
      const { address, signature, message } = await authenticateWithMetaMask();
      const token = useAuthStore.getState().token;
      
      const res = await fetch(`${API_BASE}/wallet/metamask/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ wallet_address: address, signature, message })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("BACKEND ERROR:", errorText);
        throw new Error(errorText);
      }

      const data = await res.json();
      connect(address, 'METAMASK');
      setWallets([data.wallet]);
      updateUser({ is_wallet_created: true });
      toast.success('MetaMask wallet connected!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      if (error.code === 4001) {
        toast.error('Connection rejected', { description: 'You declined the MetaMask request.' });
      } else {
        toast.error('MetaMask connection failed', { description: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <AnimatePresence mode="wait">
        {step === 'member-auth' && (
          <motion.div
            key="member-auth"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-md"
          >
            <div className="glass-card rounded-2xl p-8">
              <button onClick={() => navigate('/auth')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to role selection
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Users className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Samsung Member</h2>
                  <p className="text-xs text-muted-foreground">Non-custodial · MetaMask</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Your Nickname</label>
                  <Input
                    placeholder="e.g. GalaxyFan"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                disabled={isLoading || !nickname.trim()}
                onClick={handleMemberLogin}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Authenticating...</>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>
                    Sign in with Google
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'member-wallet' && (
          <motion.div
            key="member-wallet"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
          >
            <div className="glass-card rounded-2xl p-8">
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10">
                  <svg className="h-7 w-7" viewBox="0 0 40 40" fill="none">
                    <path d="M37.5 2.5L22.08 14.17l2.85-6.73L37.5 2.5z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.5 2.5l15.27 11.8-2.7-6.86L2.5 2.5zm29.92 24.5L28 33.5l9.5 2.62 2.73-9.25-7.81.13zm-30.15.13L5 36.12l9.5-2.62-4.42-6.5-7.81-.13z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="font-display text-xl font-bold">Connect MetaMask</h2>
                <p className="text-xs text-muted-foreground mt-1">Sign a message to verify wallet ownership</p>
              </div>

              {!isMetaMaskInstalled() && (
               <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                 <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                 <div>
                   <p className="text-xs font-semibold text-amber-700">MetaMask not detected</p>
                   <p className="text-[10px] text-amber-600 mt-0.5">
                     Install the MetaMask browser extension to continue.
                   </p>
                 </div>
               </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleMetaMaskConnect}
                  disabled={isLoading}
                  className="w-full h-12 gap-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
                  ) : (
                    <>
                      <Wallet className="h-5 w-5" />
                      Connect MetaMask
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-[10px] text-muted-foreground text-center">
                  You'll be asked to sign: <span className="font-mono font-semibold text-foreground">"Authenticate Samsung Members DAO"</span>
                </p>
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  This proves wallet ownership — no gas fees, no transaction.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
