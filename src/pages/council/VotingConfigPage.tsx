import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/council/StatusBadge';
import { useCouncilGovStore } from '@/stores/useCouncilGovStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { updateVotingConfig } from '@/services/councilService';
import { toast } from 'sonner';
import { useState } from 'react';

export default function VotingConfigPage() {
  const configs = useCouncilGovStore((s) => s.votingConfigs);
  const rules = useCouncilGovStore((s) => s.votingRules);
  const setConfigs = useCouncilGovStore((s) => s.setVotingConfigs);
  const token = useAuthStore((s) => s.token);

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const getValue = (key: string) => drafts[key] ?? configs.find((c) => c.key === key)?.value ?? '';

  const handleSave = async () => {
    try {
      for (const [key, value] of Object.entries(drafts)) {
        await updateVotingConfig(token, key, value);
      }
      setConfigs(configs.map((c) => drafts[c.key] ? { ...c, value: drafts[c.key] } : c));
      setDrafts({});
      toast.success('Voting configuration saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-primary">Voting Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure voting parameters for the current governance period</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {configs.map((c) => (
            <div key={c.key}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{c.label}</label>
              <Input
                type="number"
                value={getValue(c.key)}
                onChange={(e) => setDrafts((d) => ({ ...d, [c.key]: e.target.value }))}
                className="font-mono"
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Modify values and save to apply</p>
          <Button onClick={handleSave} disabled={Object.keys(drafts).length === 0} className="gap-2">
            <Save className="h-4 w-4" /> Save config
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h2 className="font-display text-lg font-bold text-primary mb-4">Voting Rules</h2>
        <div className="divide-y divide-border/60">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
              </div>
              <StatusBadge status={r.enforced ? 'Enforced' : 'Disabled'} />
            </div>
          ))}
          {rules.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground text-center">No voting rules configured</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
