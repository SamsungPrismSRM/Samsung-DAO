import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { MemberSidebar } from './MemberSidebar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMemberDashboardStore } from '@/stores/useMemberDashboardStore';

export function MemberLayout() {
  const navigate = useNavigate();
  const { token, isHydrated } = useAuthStore();
  const { loadMetrics } = useMemberDashboardStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      // For this feature, users must be logged in to view member dashboard fully
      // We will redirect to auth for safety
      navigate('/login', { replace: true });
      return;
    }
  }, [isHydrated, token, navigate]);

  useEffect(() => {
    if (token) {
      loadMetrics();
      // Poll every 30s
      const interval = setInterval(loadMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [token, loadMetrics]);

  return (
    <div className="flex bg-background">
      <MemberSidebar />
      <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
