import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToggleRow } from '@/components/council/ToggleRow';
import { useCouncilGovStore } from '@/stores/useCouncilGovStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { createGiveaway } from '@/services/councilService';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GiveawaySetup() {
  const giveaways = useCouncilGovStore((s) => s.giveaways);
  const addGiveaway = useCouncilGovStore((s) => s.addGiveaway);
  const token = useAuthStore((s) => s.token);

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [prize, setPrize] = useState('');
  const [description, setDescription] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [requireKyc, setRequireKyc] = useState(true);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title || !prize || !closesAt) {
      toast.error('Title, prize, and close date are required');
      return;
    }
    setSubmitting(true);
    try {
      const g = await createGiveaway(token, { title, prize, description, closesAt, requireKyc, allowMultiple });
      addGiveaway(g);
      toast.success('Giveaway created');
      setCreating(false);
      setTitle(''); setPrize(''); setDescription(''); setClosesAt('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create giveaway');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Giveaway Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">{giveaways.length} giveaways</p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create giveaway
          </Button>
        )}
      </div>

      {creating && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-dashed border-primary/30 bg-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Giveaway title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="PRISM Research Giveaway" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Prize</label>
              <Input value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="Samsung Galaxy Tab S9" />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (optional)</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Closes at</label>
            <Input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className="max-w-sm" />
          </div>
          <ToggleRow title="Require KYC verification" description="Only KYC-verified members can enter" checked={requireKyc} onCheckedChange={setRequireKyc} />
          <ToggleRow title="Allow multiple entries" description="Members can register more than once" checked={allowMultiple} onCheckedChange={setAllowMultiple} />
          <div className="flex gap-3 mt-4">
            <Button className="flex-1" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create giveaway'}
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {giveaways.map((g) => (
          <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{g.title}</p>
              <p className="text-xs text-muted-foreground">
                Prize: {g.prize} · Closes {format(new Date(g.closes_at), 'M/d/yyyy')}
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {new Date(g.closes_at) > new Date() ? 'Open' : 'Closed'}
            </span>
          </motion.div>
        ))}
        {giveaways.length === 0 && !creating && (
          <p className="py-12 text-center text-muted-foreground text-sm">No giveaways yet</p>
        )}
      </div>
    </div>
  );
}
