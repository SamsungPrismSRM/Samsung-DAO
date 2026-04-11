import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X, User, LogOut, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletButton } from '@/components/WalletButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { toast } from 'sonner';

const baseNavItems = [
  { label: 'Home', path: '/' },
  { label: 'Community', path: '/community' },
  {
    label: 'Governance',
    children: [
      { label: 'Proposals', path: '/governance/proposals' },
      { label: 'Voting', path: '/governance' },
      { label: 'Council', path: '/governance/council' },
    ],
  },
  { label: 'Forum', path: '/forum' },
  { label: 'Member', path: '/member/dashboard' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGovOpen, setMobileGovOpen] = useState(false);
  const [govOpen, setGovOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { disconnect } = useWalletStore();

  const isCouncil = user?.role === 'COUNCIL';

  const navItems = baseNavItems.filter((item) => {
    if ('path' in item && item.path === '/member/dashboard') {
      if (isCouncil) return false;
      return isAuthenticated;
    }
    return true;
  });

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!mobileOpen) {
      setMobileGovOpen(false);
      return;
    }
    const onGovernanceRoute =
      location.pathname === '/governance' || location.pathname.startsWith('/governance/');
    if (onGovernanceRoute) setMobileGovOpen(true);
  }, [mobileOpen, location.pathname]);

  const handleLogout = () => {
    disconnect();
    logout();
    import('@/lib/firebase').then(({ auth }) => auth.signOut());
    toast.success('Logged out successfully');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full max-w-full min-w-0 glass-card-elevated border-b border-border/50"
    >
      <div className="container mx-auto flex h-16 min-w-0 max-w-full items-center gap-2 px-2 sm:px-4">
        {/* Logo: shrink-0 mark + min-w-0 text so the bar never clips the brand on narrow viewports */}
        <Link
          to={isCouncil ? '/council' : '/'}
          className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden py-1 no-underline hover:opacity-90"
        >
          <img
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-lg object-cover"
            decoding="async"
          />
          <span className="font-display min-w-0 truncate text-sm font-bold leading-tight text-foreground sm:text-base md:text-lg">
            <span className="whitespace-nowrap">
              {isCouncil ? (
                <>
                  Samsung <span className="gradient-text">DAO</span>
                </>
              ) : (
                <>
                  Samsung Members <span className="gradient-text">DAO</span>
                </>
              )}
            </span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setGovOpen(true)}
                onMouseLeave={() => setGovOpen(false)}
              >
                <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${govOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {govOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-1 w-48 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                            isActive(child.path)
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path!}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.path!)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            )
          )}
          {isAuthenticated && user?.role === 'COUNCIL' && (
            <Link
              to="/council"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === '/council' || location.pathname.startsWith('/council/')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Council HQ
            </Link>
          )}
        </div>

        {/* Right side (desktop) */}
        <div className="hidden min-w-0 shrink-0 items-center gap-3 md:flex">
          {isAuthenticated && user && (
            <div className="hidden lg:flex items-center gap-2 mr-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                user.role === 'COUNCIL'
                  ? 'bg-blue-500/10 text-blue-600'
                  : 'bg-emerald-500/10 text-emerald-600'
              }`}>
                {user.role}
              </span>
              {user.role === 'COUNCIL' && user.assigned_hq && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="max-w-[120px] truncate">{user.assigned_hq.split('(')[0].trim()}</span>
                </span>
              )}
              <span className="text-sm font-medium text-foreground">
                {user.nickname || user.name}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <WalletButton />
            {!isAuthenticated && (
              <Link to="/login">
                <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5 text-primary">
                  Sign In
                </Button>
              </Link>
            )}
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <Link to="/profile">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile toggle — always visible and never squashed */}
        <button
          type="button"
          className="inline-flex shrink-0 touch-manipulation items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted/80 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="space-y-1 p-4">
              {isAuthenticated && user && (
                <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-muted/50">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    user.role === 'COUNCIL' ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {user.role}
                  </span>
                  <span className="text-sm font-medium">{user.nickname || user.name}</span>
                  {user.role === 'COUNCIL' && user.assigned_hq && (
                    <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-[120px]">
                      {user.assigned_hq.split('(')[0].trim()}
                    </span>
                  )}
                </div>
              )}
              {navItems.map((item) =>
                item.children ? (
                  <div key={item.label} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setMobileGovOpen((o) => !o)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                      aria-expanded={mobileGovOpen}
                    >
                      {item.label}
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          mobileGovOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {mobileGovOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-2 space-y-0.5 border-l-2 border-primary/15 pl-3 py-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.path}
                                to={child.path}
                                onClick={() => setMobileOpen(false)}
                                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                                  isActive(child.path)
                                    ? 'bg-primary/10 font-medium text-primary'
                                    : 'text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path!}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive(item.path!)
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              )}
              {isAuthenticated && user?.role === 'COUNCIL' && (
                <Link
                  to="/council"
                  onClick={() => setMobileOpen(false)}
                  className={`mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    location.pathname === '/council' || location.pathname.startsWith('/council/')
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Council HQ
                </Link>
              )}
              {isAuthenticated && (
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={`mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive('/profile')
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <User className="h-4 w-4 shrink-0" />
                  Profile
                </Link>
              )}
              <div className="flex gap-2 pt-3">
                <div className="min-w-0 flex-1 [&_button]:w-full">
                  <WalletButton />
                </div>
                {!isAuthenticated ? (
                  <div className="min-w-0 flex-1">
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="block w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 shrink-0 gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
