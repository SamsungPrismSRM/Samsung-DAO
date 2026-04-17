import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProposalModal } from '@/components/ProposalModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMemberPortalStore } from '@/stores/useMemberPortalStore';
import { executeDecision } from '@/services/proposalService';
import { toast } from 'sonner';

type DecisionActionsProps = {
  onRefresh?: () => void;
  queuedOnchainProposalId?: number | null;
};

export function DecisionActions({ onRefresh, queuedOnchainProposalId }: DecisionActionsProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const walletConnected = useMemberPortalStore((s) => s.wallet.isConnected);
  const [openLocal, setOpenLocal] = useState(false);
  const [openGlobal, setOpenGlobal] = useState(false);
  const [executing, setExecuting] = useState(false);
  const isCouncil = user?.role === 'COUNCIL' || user?.role === 'ADMIN';
  const region = (user?.assigned_hq ?? 'INDIA') as 'INDIA' | 'KOREA' | 'US';

  const onExecute = async () => {
    if (!queuedOnchainProposalId) {
      toast.info('No queued proposal selected');
      return;
    }
    setExecuting(true);
    try {
      await executeDecision(queuedOnchainProposalId);
      toast.success('Decision executed');
      onRefresh?.();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Execution failed';
      toast.error(msg);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-border/50 bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {!isCouncil ? (
          <>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={!walletConnected} onClick={() => setOpenLocal(true)}>
              ➕ Create Local Proposal
            </Button>
            <Button variant="outline" className="border-blue-300 text-blue-700" onClick={() => navigate('/member/proposals')}>
              🗳 Vote on Local
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => navigate('/member/proposals')}>
              🌍 View Global Proposals
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" className="border-purple-300 text-purple-700" onClick={() => navigate('/council/proposals')}>
              ⚖ Review Proposals
            </Button>
          </>
        )}
      </div>
      <ProposalModal open={openLocal} scope="LOCAL" region={region} onOpenChange={setOpenLocal} onCreated={onRefresh} />
      <ProposalModal open={openGlobal} scope="GLOBAL" region={null} onOpenChange={setOpenGlobal} onCreated={onRefresh} />
    </div>
  );
}
