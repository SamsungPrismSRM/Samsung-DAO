import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { memberApi } from '@/lib/memberApi';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type LotteryModel = {
  id: string;
  title: string;
  prize: string;
  draw_date: string;
  min_reputation: number;
};

export default function Lottery() {
  const [lottery, setLottery] = useState<LotteryModel | null>(null);
  const [entered, setEntered] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await memberApi.get<{
        lottery: LotteryModel | null;
        entered: boolean;
        entryCount: number;
      }>('/lottery');
      setLottery(data.lottery);
      setEntered(data.entered);
      setEntryCount(data.entryCount);
    } catch {
      toast.error('Could not load lottery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleEnter = async () => {
    if (!lottery) return;
    setBusy(true);
    try {
      const { data } = await memberApi.post<{ entryCount: number }>('/lottery/enter', {
        lotteryId: lottery.id,
      });
      toast.success('You are entered in the draw');
      setEntered(true);
      setEntryCount(data.entryCount);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not enter';
      toast.error(String(msg));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Lottery</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter active lotteries to win SPU rewards</p>
      </div>

      {loading ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : !lottery ? (
        <div className="glass-card rounded-xl p-10 border border-border/50 text-center text-sm text-muted-foreground">
          There is no open lottery at the moment.
        </div>
      ) : (
        <div className="glass-card rounded-xl p-8 border border-border/50 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lottery</p>
            {entered ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">
                Entered
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Open
              </span>
            )}
          </div>
          <h2 className="font-display text-xl font-bold text-primary">{lottery.title}</h2>
          <p className="text-sm text-muted-foreground">Prize pool: {lottery.prize}</p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border/50 pt-4">
            <span>
              <span className="font-semibold text-foreground">Draw:</span>{' '}
              {new Date(lottery.draw_date).toLocaleDateString()}
            </span>
            <span>
              <span className="font-semibold text-foreground">Entries:</span> {entryCount}
            </span>
            <span>
              <span className="font-semibold text-foreground">Min reputation:</span> {lottery.min_reputation}
            </span>
          </div>
          <Button
            className="w-full sm:w-auto bg-primary"
            disabled={entered || busy}
            onClick={handleEnter}
          >
            {entered ? 'Entered' : busy ? 'Entering…' : 'Enter lottery'}
          </Button>
        </div>
      )}
    </div>
  );
}
