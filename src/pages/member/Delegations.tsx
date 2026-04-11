import { useEffect, useState } from 'react';
import { UserPlus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { memberApi } from '@/lib/memberApi';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type DelegationRow = { id: string; name: string; email: string; department: string | null };

export default function Delegations() {
  const [delegations, setDelegations] = useState<DelegationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await memberApi.get<{ delegations: DelegationRow[] }>('/delegations');
      setDelegations(data.delegations);
    } catch {
      toast.error('Could not load delegations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelegate = async () => {
    if (!email.trim()) {
      toast.error('Enter a member email');
      return;
    }
    setSaving(true);
    try {
      await memberApi.post('/delegate', { toEmail: email.trim().toLowerCase() });
      toast.success('Delegation added');
      setOpen(false);
      setEmail('');
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Delegation failed';
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await memberApi.delete(`/delegations/${id}`);
      toast.success('Delegation removed');
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not revoke';
      toast.error(String(msg));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Delegations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Delegate your voting power to trusted members · Limit: 5 outgoing
          </p>
        </div>
        <Button
          className="bg-[#1C208F] hover:bg-[#1C208F]/90 text-white font-semibold"
          onClick={() => setOpen(true)}
          disabled={delegations.length >= 5}
        >
          <UserPlus className="h-4 w-4 mr-2" /> Delegate
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delegate to a member</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Enter the corporate email of another DAO member (MEMBER role).
          </p>
          <Input
            type="email"
            placeholder="colleague@samsung.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={handleDelegate}>
              {saving ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Delegated to ({delegations.length})</h3>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : delegations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {delegations.map((d) => (
              <div
                key={d.id}
                className="glass-card rounded-xl p-4 border border-border/50 flex justify-between items-center gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary shrink-0">
                    {d.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.email}</p>
                    {d.department && (
                      <p className="text-[10px] text-muted-foreground">{d.department}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                  onClick={() => handleRevoke(d.id)}
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-10 border border-border/50 bg-muted/10 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">You haven&apos;t delegated your vote to anyone.</p>
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-4 border border-blue-500/20 bg-blue-500/5 flex gap-3 items-start mt-8">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">How delegation works</h4>
          <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-1">
            Delegation is recorded in the governance database. You can revoke at any time. Maximum five
            outgoing delegations per account.
          </p>
        </div>
      </div>
    </div>
  );
}
