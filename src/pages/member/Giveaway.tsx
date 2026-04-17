import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { memberApi } from '@/lib/memberApi';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type GiveawayModel = {
  id: string;
  title: string;
  prize: string;
  description: string | null;
  closes_at: string;
};

export default function Giveaway() {
  const [giveaway, setGiveaway] = useState<GiveawayModel | null>(null);
  const [registered, setRegistered] = useState(false);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<'GLOBAL' | 'LOCAL'>('GLOBAL');

  const load = async (nextScope: 'GLOBAL' | 'LOCAL' = scope) => {
    setLoading(true);
    try {
      const { data } = await memberApi.get<{
        giveaway: GiveawayModel | null;
        registered: boolean;
        registeredCount: number;
      }>(`/giveaway?scope=${nextScope}`);
      setGiveaway(data.giveaway);
      setRegistered(data.registered);
      setRegisteredCount(data.registeredCount);
    } catch {
      toast.error('Could not load giveaway');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(scope);
  }, [scope]);

  const handleRegister = async () => {
    if (!giveaway) return;
    setBusy(true);
    try {
      const { data } = await memberApi.post<{ registeredCount: number }>('/giveaway/register', {
        giveawayId: giveaway.id,
      });
      toast.success('Registered for giveaway');
      setRegistered(true);
      setRegisteredCount(data.registeredCount);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not register';
      toast.error(String(msg));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Giveaway</h1>
        <p className="text-sm text-muted-foreground mt-1">Register for active giveaways</p>
      </div>
      <Tabs value={scope} onValueChange={(v) => setScope(v as 'GLOBAL' | 'LOCAL')}>
        <TabsList>
          <TabsTrigger value="GLOBAL">Global</TabsTrigger>
          <TabsTrigger value="LOCAL">My Region</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : !giveaway ? (
        <div className="glass-card rounded-xl p-10 border border-border/50 text-center text-sm text-muted-foreground">
          No giveaway is open right now.
        </div>
      ) : (
        <div className="glass-card rounded-xl p-8 border border-border/50 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Giveaway</p>
            {registered ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">
                Registered
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Open
              </span>
            )}
          </div>
          <h2 className="font-display text-xl font-bold text-primary">{giveaway.title}</h2>
          {giveaway.description && (
            <p className="text-sm text-muted-foreground">{giveaway.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border/50 pt-4">
            <span>
              <span className="font-semibold text-foreground">Prize:</span> {giveaway.prize}
            </span>
            <span>
              <span className="font-semibold text-foreground">Closes:</span>{' '}
              {new Date(giveaway.closes_at).toLocaleDateString()}
            </span>
            <span>
              <span className="font-semibold text-foreground">Registered:</span> {registeredCount}
            </span>
          </div>
          <Button
            className="w-full sm:w-auto bg-primary"
            disabled={registered || busy}
            onClick={handleRegister}
          >
            {registered ? 'Registered' : busy ? 'Registering…' : 'Register'}
          </Button>
        </div>
      )}
    </div>
  );
}
