import { Navbar } from "./Navbar";
import { StatusBar } from "./StatusBar";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  role: "ADMIN" | "COUNCIL" | "MEMBER";
  children: React.ReactNode;
}

export function DashboardLayout({ role, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <StatusBar />
      <div className="flex">
        <Sidebar role={role} />
        <main className="flex-1 p-4 sm:p-6 max-w-[960px] min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}