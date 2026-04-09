import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';

export default function Onboard() {
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'COUNCIL'>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { token, user, updateUser } = useAuthStore();

  const handleOnboard = async () => {
    if (!nickname.trim()) {
      toast.error('Please enter a nickname');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Submit Onboarding Data
      const response = await fetch('http://localhost:3001/api/v1/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nickname, role })
      });

      if (!response.ok) {
         const err = await response.json();
         throw new Error(err.error || 'Onboarding failed');
      }

      const data = await response.json();
      updateUser(data.user);

      // 2. Handle Wallet Creation
      if (data.user.role === 'COUNCIL') {
         toast.info('Onboarding as Council...', { description: 'Provisioning multi-sig DFNS wallet. Please wait.' });
         // Automatically create DFNS Wallet
         const walletRes = await fetch('http://localhost:3001/api/v1/wallet/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
         });
         
         if(walletRes.ok) {
            updateUser({ is_wallet_created: true });
            toast.success('Council Wallet Provisioned!');
         }
      } else {
         toast.success('Onboarding complete!', { description: 'Please connect your non-custodial wallet.' });
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to complete onboarding', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="p-8 text-center">Loading or Unauthenticated...</div>;
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card rounded-2xl p-8"
      >
        <h2 className="font-display text-2xl font-bold mb-2">Complete your Profile</h2>
        <p className="text-sm text-muted-foreground mb-6">Choose your alias and DAO role.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Nickname</label>
            <Input 
              placeholder="e.g. Satoshi" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Select Role</label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${role === 'MEMBER' ? 'border-primary bg-primary/5' : 'border-border opacity-60'}`}
                onClick={() => setRole('MEMBER')}
              >
                <div className="font-medium text-sm">Samsung Member</div>
                <div className="text-[10px] text-muted-foreground mt-1">Non-custodial Wallet</div>
              </div>

              <div 
                className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${role === 'COUNCIL' ? 'border-primary bg-primary/5' : 'border-border opacity-60'}`}
                onClick={() => setRole('COUNCIL')}
              >
                <div className="font-medium text-sm">Council Member</div>
                <div className="text-[10px] text-muted-foreground mt-1">Custodial DFNS Multisig</div>
              </div>
            </div>
            {role === 'COUNCIL' && (
              <p className="text-xs text-orange-500 mt-2">
                * Note: Council assignment is restricted to authorized email domains only.
              </p>
            )}
          </div>
          
          <Button 
             className="w-full mt-4" 
             onClick={handleOnboard}
             disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Complete Onboarding'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
