import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileText, Wrench, Vote, Settings2,
  Gift, Ticket, ChevronLeft, ShieldCheck
} from 'lucide-react';
import { useCouncilGovStore } from '@/stores/useCouncilGovStore';

const sections = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', to: '/council', icon: LayoutDashboard, end: true },
      { label: 'Proposals', to: '/council/proposals', icon: FileText },
    ],
  },
  {
    title: 'GOVERNANCE',
    items: [
      { label: 'Rule builder', to: '/council/rules', icon: Wrench },
      { label: 'Election setup', to: '/council/elections', icon: Vote },
      { label: 'Voting config', to: '/council/voting', icon: Settings2 },
    ],
  },
  {
    title: 'EVENTS',
    items: [
      { label: 'Giveaway setup', to: '/council/giveaways', icon: Gift },
      { label: 'Lottery config', to: '/council/lotteries', icon: Ticket },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      { label: 'Audit logs', to: '/council/audit-logs', icon: ShieldCheck },
    ],
  },
];

export function CouncilSidebar() {
  const location = useLocation();
  const proposals = useCouncilGovStore((s) => s.proposals);
  const pendingCount = proposals.filter((p) =>
    ['DRAFT', 'SIGNALING', 'REVIEW'].includes(p.status)
  ).length;

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card min-h-[calc(100vh-4rem)] py-6 px-3">
      <NavLink to="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-6 px-2">
        <ChevronLeft className="h-3 w-3" /> Back to portal
      </NavLink>

      {sections.map((section) => (
        <div key={section.title} className="mb-5">
          <p className="px-2 mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            {section.title}
          </p>
          {section.items.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const showBadge = item.label === 'Proposals' && pendingCount > 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors mb-0.5',
                  active
                    ? 'bg-primary/5 text-primary font-semibold border-l-[3px] border-primary -ml-px'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
