import { motion } from 'framer-motion';
import { ConfigRow } from '@/components/council/ConfigRow';
import { useCouncilGovStore } from '@/stores/useCouncilGovStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { updateGovernanceRule } from '@/services/councilService';
import { toast } from 'sonner';

export default function RuleBuilder() {
  const rules = useCouncilGovStore((s) => s.rules);
  const updateLocal = useCouncilGovStore((s) => s.updateRuleLocal);
  const token = useAuthStore((s) => s.token);

  const handleSave = async (key: string, value: string) => {
    try {
      await updateGovernanceRule(token, key, value);
      updateLocal(key, value);
      toast.success('Rule updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update rule');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Rule Builder</h1>
        <p className="text-sm text-muted-foreground mt-1">Edit governance parameters for period #7</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        {rules.map((r) => (
          <ConfigRow
            key={r.key}
            label={r.label}
            subtitle={r.min != null && r.max != null ? `Range: ${r.min}–${r.max} ${r.unit ?? ''}` : undefined}
            value={r.value}
            unit={r.unit ?? undefined}
            editable
            onSave={(v) => handleSave(r.key, v)}
          />
        ))}
        {rules.length === 0 && (
          <p className="py-8 text-center text-muted-foreground text-sm">No governance rules found</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4"
      >
        <p className="text-sm">
          <span className="font-mono font-semibold text-primary">Note:</span>{' '}
          <span className="text-muted-foreground">
            Rule changes require multisig approval (3-of-5) and a 48h timelock before taking effect.
          </span>
        </p>
      </motion.div>
    </div>
  );
}
