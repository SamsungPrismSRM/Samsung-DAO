import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import {
  getSamsungSsoEmailSuffixes,
  isSamsungCorporateGoogleEmail,
  SAMSUNG_GOOGLE_SSO_MESSAGE,
} from '@/lib/samsung-sso';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { toast } from 'sonner';
import { Users, ArrowLeft, Loader2, Wallet, Mail, AlertTriangle } from 'lucide-react';
import { connectMemberMetaMask } from '@/lib/memberWalletConnect';
import { isMetaMaskInstalled } from '@/lib/metamask';

type MemberStep = 'member-auth' | 'member-wallet';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api/v1';

export default function MemberLogin() {
  const [step, setStep] = useState<MemberStep>('member-auth');
  const [isLoading, setIsLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailAuthMode, setEmailAuthMode] = useState<'signin' | 'signup'>('signin');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, updateUser, token, user, isHydrated, wallets } = useAuthStore();
  const { connect } = useWalletStore();

  const requireWallet = Boolean((location.state as { requireWallet?: boolean })?.requireWallet);

  useEffect(() => {
    if (!isHydrated || !token || user?.role !== 'MEMBER') return;
    const hasWallet = wallets.length > 0 && user.is_wallet_created;
    if (hasWallet) {
      navigate('/member/dashboard', { replace: true });
      return;
    }
    const canShowWalletStep = Boolean(user.nickname || user.is_onboarded);
    if (canShowWalletStep || requireWallet) {
      setStep('member-wallet');
    }
  }, [isHydrated, token, user, wallets, navigate, requireWallet]);

  const completeSessionAfterFirebase = async (firebaseUser: FirebaseUser) => {
    const t = await firebaseUser.getIdToken();

    if (!t || t.length < 100) {
      throw new Error('Invalid or missing Firebase token.');
    }

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    });
    if (!response.ok) {
      const raw = await response.text();
      let msg = raw.slice(0, 200) || 'Login failed';
      try {
        const j = JSON.parse(raw) as { error?: string };
        if (typeof j?.error === 'string') msg = j.error;
      } catch {
        /* HTML or plain text */
      }
      console.error('BACKEND ERROR:', raw.slice(0, 500));
      throw new Error(msg);
    }
    const data = await response.json();
    const u = data.user;

    login(t, u);

    if (!u.nickname) {
      if (!nickname.trim()) {
        toast.info('Enter a nickname above to finish creating your profile.');
        return;
      }
      const onboardRes = await fetch(`${API_BASE}/auth/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ nickname }),
      });
      if (!onboardRes.ok) {
        const raw = await onboardRes.text();
        let msg = 'Onboarding failed';
        try {
          const j = JSON.parse(raw) as { error?: string };
          if (typeof j?.error === 'string') msg = j.error;
        } catch {
          if (raw) msg = raw.slice(0, 200);
        }
        throw new Error(msg);
      }
      const d = await onboardRes.json();
      updateUser(d.user);
    }

    toast.success('Signed in', { description: 'Connect MetaMask on Hedera testnet to continue.' });
    setStep('member-wallet');
  };

  const handleMemberGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!isSamsungCorporateGoogleEmail(result.user.email)) {
        await signOut(auth);
        toast.error('Samsung Google SSO only', { description: SAMSUNG_GOOGLE_SSO_MESSAGE });
        return;
      }
      await completeSessionAfterFirebase(result.user);
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Sign-in failed';
      toast.error('Authentication failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberEmailAuth = async () => {
    if (!email.trim() || !password) {
      toast.error('Enter email and password');
      return;
    }
    setIsLoading(true);
    try {
      const cred =
        emailAuthMode === 'signup'
          ? await createUserWithEmailAndPassword(auth, email.trim(), password)
          : await signInWithEmailAndPassword(auth, email.trim(), password);
      await completeSessionAfterFirebase(cred.user);
    } catch (error: unknown) {
      console.error(error);
      const anyErr = error as { code?: string; message?: string };
      const code = anyErr.code ?? '';
      let description = anyErr.message ?? 'Sign-in failed';
      if (code === 'auth/email-already-in-use') description = 'This email is already registered. Try signing in.';
      if (code === 'auth/invalid-email') description = 'Enter a valid email address.';
      if (code === 'auth/weak-password') description = 'Use a stronger password (at least 6 characters).';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        description = 'Incorrect email or password.';
      }
      if (code === 'auth/too-many-requests') description = 'Too many attempts. Try again later.';
      toast.error(emailAuthMode === 'signup' ? 'Could not create account' : 'Sign-in failed', { description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetaMaskConnect = async () => {
    setIsLoading(true);
    try {
      if (!isMetaMaskInstalled()) {
        toast.error('MetaMask not detected', {
          description: 'Install the MetaMask extension to continue.',
          action: {
            label: 'Install',
            onClick: () => window.open('https://metamask.io/download/', '_blank'),
          },
        });
        return;
      }
      const { address } = await connectMemberMetaMask();
      connect(address, 'METAMASK');
      toast.success('MetaMask connected');
      navigate('/member/dashboard');
    } catch (error: unknown) {
      console.error(error);
      const anyErr = error as { code?: number };
      if (anyErr.code === 4001) {
        toast.error('Connection rejected', { description: 'You declined the MetaMask request.' });
      } else {
        toast.error('MetaMask failed', { description: error instanceof Error ? error.message : 'Unknown error' });
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
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Back to role selection
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Users className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Samsung Member</h2>
                  <p className="text-xs text-muted-foreground">Non-custodial · MetaMask · Hedera testnet</p>
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
                disabled={isLoading}
                onClick={handleMemberGoogleLogin}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Authenticating...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-2 leading-relaxed">
                Google: Samsung Workspace SSO only ({getSamsungSsoEmailSuffixes().map((s) => `@${s}`).join(', ')}).
              </p>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-card px-2 text-muted-foreground">Or email</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Password</label>
                  <Input
                    type="password"
                    autoComplete={emailAuthMode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  disabled={
                    isLoading ||
                    !email.trim() ||
                    !password ||
                    (emailAuthMode === 'signup' && !nickname.trim())
                  }
                  onClick={handleMemberEmailAuth}
                  variant="outline"
                  className="w-full h-11 gap-2 border-border"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Please wait...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      {emailAuthMode === 'signup' ? 'Create account' : 'Sign in with email'}
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {emailAuthMode === 'signup' ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        className="font-semibold text-primary hover:underline"
                        onClick={() => setEmailAuthMode('signin')}
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      New here?{' '}
                      <button
                        type="button"
                        className="font-semibold text-primary hover:underline"
                        onClick={() => setEmailAuthMode('signup')}
                      >
                        Create an account
                      </button>
                    </>
                  )}
                </p>
              </div>
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
                  <Wallet className="h-7 w-7 text-orange-600" />
                </div>
                <h2 className="font-display text-xl font-bold">Connect MetaMask</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Add Hedera testnet if prompted, then sign the message to verify your wallet. Required to open the
                  member dashboard.
                </p>
              </div>

              {!isMetaMaskInstalled() && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">MetaMask not detected</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Install the MetaMask browser extension to continue.</p>
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
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
                    </>
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
                  You&apos;ll sign:{' '}
                  <span className="font-mono font-semibold text-foreground">&quot;Authenticate Samsung Members DAO&quot;</span>
                  — no gas, no transaction.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
