import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X, User, LogOut, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletButton } from '@/components/WalletButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { toast } from 'sonner';

const navItems = [
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
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [govOpen, setGovOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { disconnect } = useWalletStore();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    disconnect();
    import('@/lib/firebase').then(({ auth }) => auth.signOut());
    toast.success('Logged out successfully');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass-card-elevated border-b border-border/50"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <span className="text-sm font-bold text-primary-foreground">S</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Samsung Members <span className="gradient-text">DAO</span>
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
        </div>

        {/* Right side */}
        <div className="hidden items-center gap-3 md:flex">
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

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
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
                  <div key={item.label} className="space-y-1">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path!}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                )
              )}
              <div className="flex gap-2 pt-3">
                <WalletButton />
                {isAuthenticated && (
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-1" /> Logout
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
