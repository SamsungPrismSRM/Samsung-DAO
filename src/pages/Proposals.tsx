import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProposalCard } from '@/components/ProposalCard';
import { useProposalStore } from '@/stores/useProposalStore';

const statusFilters = ['All', 'Active', 'Passed', 'Failed'];
const typeFilters = ['All Types', 'Feature', 'Lottery', 'Token'];

export default function Proposals() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [search, setSearch] = useState('');
  const proposals = useProposalStore(state => state.proposals);

  const filtered = proposals.filter((p) => {
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'All Types' || p.type === typeFilter.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">All Proposals</h1>
        <p className="mt-2 text-muted-foreground">Browse and vote on Feature, Lottery, and Token proposals</p>
      </motion.div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {typeFilters.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === f ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, i) => (
          <ProposalCard key={p.id} proposal={p} index={i} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">No proposals match your filters</div>
      )}
    </div>
  );
}
