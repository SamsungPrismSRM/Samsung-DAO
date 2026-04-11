import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, User, Vote, FileText, Gift, Ticket, ListTodo, Users, Clock, ChevronLeft
} from 'lucide-react';
import { useMemberDashboardStore } from '@/stores/useMemberDashboardStore';

const sections = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', to: '/member/dashboard', icon: LayoutDashboard, end: true },
      { label: 'My profile', to: '/member/profile', icon: User },
    ],
  },
  {
    title: 'PARTICIPATE',
    items: [
      { label: 'Vote', to: '/member/vote', icon: Vote, countsKey: 'activeVotes' },
      { label: 'Proposals', to: '/member/proposals', icon: FileText, countsKey: 'proposalsCreated' },
      { label: 'Lottery', to: '/member/lottery', icon: Ticket },
      { label: 'Giveaway', to: '/member/giveaway', icon: Gift },
    ],
  },
  {
    title: 'MY ACTIVITY',
    items: [
      { label: 'My proposals', to: '/member/my-proposals', icon: ListTodo },
      { label: 'My delegations', to: '/member/delegations', icon: Users },
      { label: 'History', to: '/member/history', icon: Clock },
    ],
  },
];

export function MemberSidebar() {
  const location = useLocation();
  const metrics = useMemberDashboardStore((s) => s.metrics);

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card min-h-[calc(100vh-4rem)] py-6 px-3 flex flex-col">
      <NavLink to="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-6 px-2">
        <ChevronLeft className="h-3 w-3" /> Back to portal
      </NavLink>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="px-2 mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              {section.title}
            </p>
            {section.items.map((item) => {
              const active = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              
              let badgeCount = 0;
              if (item.countsKey === 'activeVotes' && metrics?.activeVotes) badgeCount = metrics.activeVotes;
              else if (item.countsKey === 'proposalsCreated' && metrics?.proposalsCreated) badgeCount = metrics.proposalsCreated;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors mb-0.5',
                    active
                      ? 'bg-primary/10 text-primary font-semibold border-l-[3px] border-primary -ml-px'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
