import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createDecisionProposal, type DecisionRegion, type DecisionScope } from '@/services/proposalService';

type ProposalModalProps = {
  open: boolean;
  scope: DecisionScope;
  region: DecisionRegion;
  onOpenChange: (next: boolean) => void;
  onCreated?: () => void;
};

export function ProposalModal({ open, scope, region, onOpenChange, onCreated }: ProposalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'FEATURE' | 'LOTTERY' | 'TOKEN'>('FEATURE');
  const [saving, setSaving] = useState(false);
  const isLocal = scope === 'LOCAL';
  const regionLabel = useMemo(() => (isLocal ? region ?? 'UNKNOWN' : 'GLOBAL'), [isLocal, region]);

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSaving(true);
    try {
      await createDecisionProposal({
        title: title.trim(),
        description: description.trim(),
        type,
        scope,
        region: isLocal ? region : null,
      });
      toast.success(`${scope} proposal created`);
      setTitle('');
      setDescription('');
      setType('FEATURE');
      onOpenChange(false);
      onCreated?.();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Create failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isLocal ? 'Create Local Proposal' : 'Create Global Proposal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 min-h-[110px]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Type</label>
            <div className="mt-1 flex gap-2">
              {(['FEATURE', 'LOTTERY', 'TOKEN'] as const).map((item) => (
                <Button key={item} variant={type === item ? 'default' : 'outline'} size="sm" onClick={() => setType(item)}>
                  {item}
                </Button>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Region: <span className="font-semibold text-foreground">{regionLabel}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
