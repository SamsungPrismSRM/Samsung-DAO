import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/council/StatusBadge';
import { useCouncilGovStore } from '@/stores/useCouncilGovStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { createElection } from '@/services/councilService';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ElectionSetup() {
  const elections = useCouncilGovStore((s) => s.elections);
  const addElection = useCouncilGovStore((s) => s.addElection);
  const token = useAuthStore((s) => s.token);

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('single_choice');
  const [scope, setScope] = useState<'GLOBAL' | 'LOCAL'>('GLOBAL');
  const [region, setRegion] = useState<'INDIA' | 'KOREA' | 'US' | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requireRep, setRequireRep] = useState(false);
  const [allowDelegation, setAllowDelegation] = useState(true);
  const [snapshot, setSnapshot] = useState(false);
  const [candidates, setCandidates] = useState([
    { name: '', department: '' },
    { name: '', department: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addCandidate = () => setCandidates((c) => [...c, { name: '', department: '' }]);
  const updateCandidate = (i: number, field: 'name' | 'department', val: string) =>
    setCandidates((c) => c.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleCreate = async () => {
    if (!title || !startDate || !endDate) {
      toast.error('Title, start date, and end date are required');
      return;
    }
    if (scope === 'LOCAL' && !region) {
      toast.error('Region is required for LOCAL election');
      return;
    }
    setSubmitting(true);
    try {
      const el = await createElection(token, {
        title, type, startDate, endDate,
        scope,
        region: scope === 'LOCAL' ? region : null,
        requireReputation: requireRep, allowDelegation, snapshotEligibility: snapshot,
        candidates: candidates.filter((c) => c.name.trim()),
      });
      addElection(el);
      toast.success('Election created');
      setCreating(false);
      setTitle(''); setStartDate(''); setEndDate('');
      setScope('GLOBAL'); setRegion('');
      setCandidates([{ name: '', department: '' }, { name: '', department: '' }]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create election');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Election Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">{elections.length} elections</p>
        </div>
        {creating ? (
          <Button variant="destructive" onClick={() => setCreating(false)}>Cancel</Button>
        ) : (
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create election
          </Button>
        )}
      </div>

      {creating && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-dashed border-primary/30 bg-card p-6 mb-8"
        >
          <h2 className="font-display text-lg font-bold text-primary mb-4">New Election</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
              <Input placeholder="e.g. Council Election — Q3 2025" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_choice">Single choice</SelectItem>
                  <SelectItem value="multi_choice">Multi choice</SelectItem>
                  <SelectItem value="ranked">Ranked</SelectItem>
                </SelectContent>
              </Select>
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Start</label>
              <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">End</label>
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mb-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={requireRep} onCheckedChange={(v) => setRequireRep(v === true)} /> Require reputation
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={allowDelegation} onCheckedChange={(v) => setAllowDelegation(v === true)} /> Allow delegation
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={snapshot} onCheckedChange={(v) => setSnapshot(v === true)} /> Snapshot eligibility
            </label>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Candidates (min 2)</p>
          {candidates.map((c, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 mb-2">
              <Input placeholder="Name" value={c.name} onChange={(e) => updateCandidate(i, 'name', e.target.value)} />
              <Input placeholder="Department" value={c.department} onChange={(e) => updateCandidate(i, 'department', e.target.value)} />
            </div>
          ))}
          <button onClick={addCandidate} className="text-sm text-primary font-medium mt-1 mb-4 flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add candidate
          </button>
          <Button className="w-full" onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create election'}
          </Button>
        </motion.div>
      )}

      <div className="space-y-3">
        {elections.map((el) => (
          <motion.div
            key={el.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <StatusBadge status={el.status} />
              <div>
                <p className="text-sm font-semibold text-foreground">{el.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(el.start_date), 'M/d/yyyy')} — {format(new Date(el.end_date), 'M/d/yyyy')}
                  {' · '}{el.candidates?.length ?? 0} candidates · {el.eligible_count} eligible
                </p>
              </div>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {el.type.replace('_', ' ')} · {el.scope ?? 'GLOBAL'}{el.scope === 'LOCAL' ? `/${el.region ?? '—'}` : ''}
            </span>
          </motion.div>
        ))}
        {elections.length === 0 && !creating && (
          <p className="py-12 text-center text-muted-foreground text-sm">No elections yet</p>
        )}
      </div>
    </div>
  );
}
