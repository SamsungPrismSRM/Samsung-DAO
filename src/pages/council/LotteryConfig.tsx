import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleRow } from '@/components/council/ToggleRow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCouncilGovStore } from '@/stores/useCouncilGovStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { createLottery } from '@/services/councilService';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function LotteryConfig() {
  const lotteries = useCouncilGovStore((s) => s.lotteries);
  const addLottery = useCouncilGovStore((s) => s.addLottery);
  const token = useAuthStore((s) => s.token);

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [prize, setPrize] = useState('');
  const [scope, setScope] = useState<'GLOBAL' | 'LOCAL'>('GLOBAL');
  const [region, setRegion] = useState<'INDIA' | 'KOREA' | 'US' | ''>('');
  const [drawDate, setDrawDate] = useState('');
  const [minRep, setMinRep] = useState(100);
  const [onchain, setOnchain] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title || !prize || !drawDate) {
      toast.error('Title, prize, and draw date are required');
      return;
    }
    if (scope === 'LOCAL' && !region) {
      toast.error('Region is required for LOCAL lottery');
      return;
    }
    setSubmitting(true);
    try {
      const l = await createLottery(token, {
        title,
        prize,
        drawDate,
        minReputation: minRep,
        isOnchainRandom: onchain,
        scope,
        region: scope === 'LOCAL' ? region : null,
      });
      addLottery(l);
      toast.success('Lottery created');
      setCreating(false);
      setTitle(''); setPrize(''); setDrawDate(''); setScope('GLOBAL'); setRegion('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create lottery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Lottery Config</h1>
          <p className="text-sm text-muted-foreground mt-1">{lotteries.length} lotteries</p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create lottery
          </Button>
        )}
      </div>

      {creating && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-dashed border-primary/30 bg-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Lottery title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q2 Samsung SPU Lottery" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Prize</label>
              <Input value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="500 SPU" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Scope</label>
              <Select value={scope} onValueChange={(v) => setScope(v as 'GLOBAL' | 'LOCAL')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  <SelectItem value="LOCAL">Local</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {scope === 'LOCAL' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Region</label>
                <Select value={region} onValueChange={(v) => setRegion(v as 'INDIA' | 'KOREA' | 'US')}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIA">INDIA</SelectItem>
                    <SelectItem value="KOREA">KOREA</SelectItem>
                    <SelectItem value="US">US</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Draw date</label>
              <Input type="datetime-local" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Min. reputation</label>
              <Input type="number" value={minRep} onChange={(e) => setMinRep(Number(e.target.value))} />
            </div>
          </div>
          <ToggleRow title="Require minimum reputation" description={`Only members above ${minRep} pts can enter`} checked={minRep > 0} disabled />
          <ToggleRow title="On-chain random selection" description="Use Hedera VRF for winner selection" checked={onchain} onCheckedChange={setOnchain} />
          <div className="flex gap-3 mt-4">
            <Button className="flex-1" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create lottery'}
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {lotteries.map((l) => (
          <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{l.title}</p>
              <p className="text-xs text-muted-foreground">
                Prize: {l.prize} · Draw {format(new Date(l.draw_date), 'M/d/yyyy')}
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {l.is_onchain_random ? 'VRF' : 'Off-chain'} · {l.min_reputation}+ pts · {l.scope ?? 'GLOBAL'}{l.scope === 'LOCAL' ? `/${l.region ?? '—'}` : ''}
            </span>
          </motion.div>
        ))}
        {lotteries.length === 0 && !creating && (
          <p className="py-12 text-center text-muted-foreground text-sm">No lotteries yet</p>
        )}
      </div>
    </div>
  );
}
