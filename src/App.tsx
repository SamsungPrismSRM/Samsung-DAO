import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { AuthHydrator } from "@/components/AuthHydrator";
import Index from "./pages/Index";
import Community from "./pages/Community";
import Forum from "./pages/Forum";
import Governance from "./pages/Governance";
import Proposals from "./pages/Proposals";
import VotingPage from "./pages/VotingPage";
import Council from "./pages/Council";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import RoleSelect from "./pages/auth/RoleSelect";
import MemberLogin from "./pages/auth/MemberLogin";
import CouncilLogin from "./pages/auth/CouncilLogin";
import NotFound from "./pages/NotFound";
import Onboard from "./pages/Onboard";

import { DataLoader } from "./components/DataLoader";

// Council pages
import { CouncilLayout } from "./components/council/CouncilLayout";
import CouncilDashboard from "./pages/council/CouncilDashboard";
import ProposalReview from "./pages/council/ProposalReview";
import RuleBuilder from "./pages/council/RuleBuilder";
import ElectionSetup from "./pages/council/ElectionSetup";
import VotingConfigPage from "./pages/council/VotingConfigPage";
import GiveawaySetup from "./pages/council/GiveawaySetup";
import LotteryConfig from "./pages/council/LotteryConfig";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthHydrator />
        <DataLoader />
        <div className="min-h-screen bg-background">
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/community" element={<Community />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/governance" element={<Governance />} />
            <Route path="/governance/proposals" element={<Proposals />} />
            <Route path="/governance/vote/:id" element={<VotingPage />} />
            <Route path="/governance/council" element={<Council />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<RoleSelect />} />
            <Route path="/auth/member" element={<MemberLogin />} />
            <Route path="/auth/council" element={<CouncilLogin />} />
            <Route path="/login" element={<RoleSelect />} />
            <Route path="/onboard" element={<Onboard />} />

            {/* Council Governance System */}
            <Route path="/council" element={<CouncilLayout />}>
              <Route index element={<CouncilDashboard />} />
              <Route path="proposals" element={<ProposalReview />} />
              <Route path="rules" element={<RuleBuilder />} />
              <Route path="elections" element={<ElectionSetup />} />
              <Route path="voting" element={<VotingConfigPage />} />
              <Route path="giveaways" element={<GiveawaySetup />} />
              <Route path="lotteries" element={<LotteryConfig />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
