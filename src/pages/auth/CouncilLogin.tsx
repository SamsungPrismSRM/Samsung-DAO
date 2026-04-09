import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useCouncilStore } from '@/stores/useCouncilStore';
import { deriveHQ } from '@/lib/deriveHQ';
import { toast } from 'sonner';
import { Shield, ArrowLeft, Check, Globe, Key, Loader2, Mail } from 'lucide-react';

type CouncilStep = 'council-auth' | 'council-hq-select' | 'council-provisioning' | 'council-complete';

// Samsung 15 Regional HQs grouped by Region — id matches DB HQ.id
const REGIONAL_HQS = [
  {
    region: "AMERICAS REGION",
    hqs: [
      { id: "USA", name: "North America HQ", location: "New Jersey / Texas", flag: "🇺🇸" },
      { id: "BRAZIL", name: "Latin America HQ", location: "São Paulo", flag: "🇧🇷" },
      { id: "CANADA", name: "Canada HQ", location: "Toronto", flag: "🇨🇦" }
    ]
  },
  {
    region: "EUROPE / MIDDLE EAST / AFRICA",
    hqs: [
      { id: "EUROPE", name: "Europe HQ", location: "UK / Munich", flag: "🇪🇺" },
      { id: "UAE", name: "Middle East HQ", location: "Dubai", flag: "🇦🇪" },
      { id: "AFRICA", name: "Africa HQ", location: "Johannesburg", flag: "🇿🇦" }
    ]
  },
  {
    region: "GREATER CHINA REGION",
    hqs: [
      { id: "CHINA", name: "China HQ", location: "Beijing", flag: "🇨🇳" },
      { id: "HONG_KONG", name: "Hong Kong HQ", location: "Hong Kong", flag: "🇭🇰" },
      { id: "TAIWAN", name: "Taiwan HQ", location: "Taipei", flag: "🇹🇼" }
    ]
  },
  {
    region: "ASIA-PACIFIC REGION",
    hqs: [
      { id: "INDIA", name: "India HQ", location: "Noida / Gurgaon", flag: "🇮🇳" },
      { id: "SINGAPORE", name: "Southeast Asia HQ", location: "Singapore", flag: "🇸🇬" },
      { id: "AUSTRALIA", name: "Oceania HQ", location: "Sydney", flag: "🇦🇺" }
    ]
  },
  {
    region: "KOREA & GLOBAL CORE",
    hqs: [
      { id: "KOREA", name: "Korea HQ", location: "Suwon - Global", flag: "🇰🇷" },
      { id: "DIGITAL_CITY", name: "Samsung Digital City", location: "Strategic HQ / R&D", flag: "🇰🇷" },
      { id: "SEMICONDUCTOR", name: "Global Device Solutions HQ", location: "Semiconductor division", flag: "🌐" }
    ]
  }
];

const SAMSUNG_HQS = REGIONAL_HQS.flatMap(r => r.hqs);

const OFFICIAL_HQ_ACCOUNTS = [
  { email: 'samsung+kr@gmail.com', pass: 'kr_samsung', hqId: 'KOREA', name: 'Korea' },
  { email: 'samsung+us@gmail.com', pass: 'us_samsung', hqId: 'USA', name: 'USA' },
  { email: 'samsung+india@gmail.com', pass: 'india_samsung', hqId: 'INDIA', name: 'India' },
  { email: 'samsung+europe@gmail.com', pass: 'europe_samsung', hqId: 'EUROPE', name: 'Europe' },
  { email: 'samsung+uae@gmail.com', pass: 'uae_samsung', hqId: 'UAE', name: 'UAE' },
  { email: 'samsung+africa@gmail.com', pass: 'africa_samsung', hqId: 'AFRICA', name: 'Africa' },
  { email: 'samsung+china@gmail.com', pass: 'china_samsung', hqId: 'CHINA', name: 'China' },
  { email: 'samsung+hongkong@gmail.com', pass: 'hongkong_samsung', hqId: 'HONG_KONG', name: 'Hong Kong' },
  { email: 'samsung+taiwan@gmail.com', pass: 'taiwan_samsung', hqId: 'TAIWAN', name: 'Taiwan' },
  { email: 'samsung+singapore@gmail.com', pass: 'singapore_samsung', hqId: 'SINGAPORE', name: 'Singapore' },
  { email: 'samsung+australia@gmail.com', pass: 'australia_samsung', hqId: 'AUSTRALIA', name: 'Australia' },
  { email: 'samsung+canada@gmail.com', pass: 'canada_samsung', hqId: 'CANADA', name: 'Canada' },
  { email: 'samsung+brazil@gmail.com', pass: 'brazil_samsung', hqId: 'BRAZIL', name: 'Brazil' },
  { email: 'samsung+germany@gmail.com', pass: 'germany_samsung', hqId: 'SEMICONDUCTOR', name: 'Semiconductor' },
  { email: 'samsung+japan@gmail.com', pass: 'japan_samsung', hqId: 'DIGITAL_CITY', name: 'Digital City' },
];

const API_BASE = 'http://localhost:3001/api/v1';

export default function CouncilLogin() {
  const [step, setStep] = useState<CouncilStep>('council-auth');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [availableHqs, setAvailableHqs] = useState<Record<string, boolean>>({});
  const [councilData, setCouncilData] = useState<any>(null);
  const [shardProgress, setShardProgress] = useState(0);
  
  const navigate = useNavigate();
  const { login, updateUser, setWallets } = useAuthStore();
  const { connect, setKeyShards, setHqAssignment } = useWalletStore();
  const { selectedHQ, alias, setHQ } = useCouncilStore();

  useEffect(() => {
    fetchHqAvailability();
  }, []);

  const fetchHqAvailability = async () => {
    try {
      const response = await fetch(`${API_BASE}/data/council`);
      if (response.ok) {
         // Assuming this returns availability, adapt otherwise
      }
    } catch {
      // Ignore
    }
  };

  const firebaseAuth = async () => {
    if (authMethod === 'google') {
      const result = await signInWithPopup(auth, googleProvider);
      return await result.user.getIdToken();
    } else {
      if (!email || !password) throw new Error('Email and password required');
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return await result.user.getIdToken();
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          return await result.user.getIdToken();
        }
        throw err;
      }
    }
  };

  const handleCouncilLogin = async () => {
    setIsLoading(true);
    try {
      const token = await firebaseAuth();
      const userEmail = auth.currentUser?.email || email;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log("TOKEN:", token);

      if (!token || token.length < 100) {
        throw new Error("Invalid or missing Firebase token.");
      }
      
      const derivedHQ = deriveHQ(userEmail, timezone);
      setHQ(derivedHQ); 

      const response = await fetch(`${API_BASE}/auth/council-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ timezone })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("BACKEND ERROR:", errorText);
        throw new Error(errorText);
      }

      const data = await response.json();
      login(token, data.user);
      setHQ(data.hq); 
      
      if (data.walletExists) {
        const walletRes = await fetch(`${API_BASE}/wallet/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          if (walletData.wallets && walletData.wallets.length > 0) {
            setWallets(walletData.wallets);
            connect(walletData.wallets[0].wallet_address, 'DFNS');
            if (walletData.shardData?.keyShards) setKeyShards(walletData.shardData.keyShards);
            if (walletData.shardData?.assignedHq) setHqAssignment(walletData.shardData.assignedHq);
          }
        }
        toast.info('Existing council identity restored');
        setTimeout(() => setStep('council-complete'), 800);
      } else {
        setStep('council-hq-select'); 
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Council login failed', { description: error.message });
      navigate('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeHqSelection = async () => {
    if (!selectedHQ) return;
    await proceedToProvisioning(useAuthStore.getState().token);
  };

  const proceedToProvisioning = async (token: string | null) => {
    if (!token) token = useAuthStore.getState().token;
    setStep('council-provisioning');
    setShardProgress(0);

    const progressInterval = setInterval(() => {
      setShardProgress(prev => {
        if (prev >= 15) { clearInterval(progressInterval); return 15; }
        return prev + 1;
      });
    }, 200);

    try {
      const walletRes = await fetch(`${API_BASE}/dfns/create-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });

      clearInterval(progressInterval);
      setShardProgress(15);

      if (!walletRes.ok) {
        const errorText = await walletRes.text();
        console.error("BACKEND ERROR:", errorText);
        throw new Error(errorText);
      }

      const walletData = await walletRes.json();
      const createdWallet = walletData.wallet;

      toast.success('DFNS Multisig Provisioned');
      connect(createdWallet.hedera_account_id, 'DFNS');
      setWallets([createdWallet]);
      updateUser({ is_wallet_created: true });

      setCouncilData({
        hederaAccountId: createdWallet.hedera_account_id,
        walletId: createdWallet.dfns_wallet_id,
        assignedHq: useCouncilStore.getState().selectedHQ,
        threshold: 8,
        totalShards: 15
      });

      setTimeout(() => setStep('council-complete'), 800);
    } catch (err: any) {
      toast.error('Provisioning failed', { description: err.message });
      navigate('/auth');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <AnimatePresence mode="wait">
        
        {step === 'council-auth' && (
          <motion.div
            key="council-auth"
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Council Identity</h2>
                  <p className="text-xs text-muted-foreground">Step 1: Set your identity & auth</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Council Alias</label>
                  <Input
                    value={alias || 'Auto-computed on login'}
                    disabled
                    readOnly
                    className="mt-1 bg-muted/50 text-muted-foreground font-mono"
                  />
                </div>

                <div className="pt-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">Auth Method</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                    <button
                      onClick={() => setAuthMethod('google')}
                      className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${authMethod === 'google' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>
                      Google
                    </button>
                    <button
                      onClick={() => setAuthMethod('email')}
                      className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${authMethod === 'email' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Mail className="h-3 w-3" />
                      Email
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {authMethod === 'email' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-2"
                    >
                      <Input
                        type="email"
                        placeholder="Corporate Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10"
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10"
                      />

                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Development: HQ Quick Login</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {OFFICIAL_HQ_ACCOUNTS.map((acc) => (
                            <button
                              key={acc.email}
                              onClick={() => {
                                setEmail(acc.email);
                                setPassword(acc.pass);
                                setHQ(acc.hqId);
                                toast.success(`Autofilled for ${acc.name}`);
                              }}
                              className="px-2 py-1.5 text-[10px] font-medium rounded-lg border border-border/50 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-muted-foreground hover:text-blue-600 truncate"
                              title={acc.hqId}
                            >
                              {acc.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                disabled={isLoading || (authMethod === 'email' && (!email || !password))}
                onClick={handleCouncilLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> One moment...</>
                ) : (
                  <>Continue to HQ Selection</>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'council-hq-select' && (
          <motion.div
            key="council-hq-select"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-2xl"
          >
            <div className="glass-card rounded-2xl p-8">
              <button onClick={() => setStep('council-auth')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to identity
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Select Regional HQ</h2>
                  <p className="text-xs text-muted-foreground">Step 2: Assign your account to a Samsung HQ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {REGIONAL_HQS.map((region) => (
                  <div key={region.region} className="space-y-3">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{region.region}</h3>
                    <div className="space-y-2">
                      {region.hqs.map((hq) => {
                        const isAvailable = availableHqs[hq.id] !== false;
                        const isSelected = selectedHQ === hq.id;

                        return (
                          <div
                            key={hq.id}
                            onClick={() => isAvailable && setHQ(hq.id)}
                            className={`
                              relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
                              ${isSelected ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500' : 'border-border/50 hover:border-blue-500/30 hover:bg-muted/30'}
                              ${!isAvailable ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : ''}
                            `}
                          >
                            <span className="text-xl">{hq.flag}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-600' : 'text-foreground'}`}>{hq.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{hq.location}</p>
                            </div>
                            {!isAvailable && (
                              <span className="text-[9px] font-bold text-destructive uppercase">Taken</span>
                            )}
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <Check className="h-3 w-3 text-blue-500" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                disabled={isLoading || !selectedHQ}
                onClick={finalizeHqSelection}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Finalizing selection...</>
                ) : (
                  <>Complete HQ Registration</>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'council-provisioning' && (
          <motion.div
            key="council-provisioning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg"
          >
            <div className="glass-card rounded-2xl p-8">
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
                  <Key className="h-7 w-7 text-blue-500 animate-pulse" />
                </div>
                <h2 className="font-display text-xl font-bold">Provisioning Council Wallet</h2>
                <p className="text-xs text-muted-foreground mt-1">Distributing key shards across 15 Regional HQs via DFNS...</p>
              </div>

              <div className="space-y-1.5 mb-4 max-h-[300px] overflow-y-auto pr-1">
                {SAMSUNG_HQS.map((hq, i) => (
                  <motion.div
                    key={hq.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: i < shardProgress ? 1 : 0.3,
                      x: 0
                    }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${i < shardProgress ? 'bg-blue-500/5 border-blue-500/20' : 'bg-transparent border-transparent'} border`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{hq.flag}</span>
                      <span className="font-medium">{hq.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">— {hq.location}</span>
                    </div>
                    {i < shardProgress ? (
                      <Check className="h-3 w-3 text-blue-500" />
                    ) : (
                      <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <div className="text-xs text-muted-foreground">{shardProgress}/15 shards distributed</div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <motion.div
                    className="bg-blue-500 h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(shardProgress / 15) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'council-complete' && councilData && (
          <motion.div
            key="council-complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg"
          >
            <div className="glass-card rounded-2xl p-8">
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <Check className="h-7 w-7 text-emerald-500" />
                </div>
                <h2 className="font-display text-xl font-bold">Council Wallet Ready</h2>
                <p className="text-xs text-muted-foreground mt-1">Your DFNS-managed Hedera wallet has been provisioned</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Hedera Account</span>
                  <span className="text-sm font-mono font-semibold">{councilData.hederaAccountId}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">DFNS Wallet ID</span>
                  <span className="text-xs font-mono">{councilData.walletId}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Assigned HQ</span>
                  <span className="text-sm font-semibold">{councilData.assignedHq}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <span className="text-xs text-blue-600 font-medium">Multisig Threshold</span>
                  <span className="text-sm font-bold text-blue-600">{councilData.threshold} of {councilData.totalShards}</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Key Shard Distribution</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {SAMSUNG_HQS.map((hq) => (
                    <div
                      key={hq.id}
                      className="flex flex-col items-center p-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10"
                      title={hq.name}
                    >
                      <span className="text-base">{hq.flag}</span>
                      <span className="text-[8px] text-muted-foreground text-center leading-tight mt-0.5 truncate w-full">{hq.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
              >
                Enter Dashboard
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
