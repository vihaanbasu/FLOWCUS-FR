import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell.jsx';
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard.jsx';
import { LoginPage } from '@/features/auth/LoginPage.jsx';
import { SignUpPage } from '@/features/auth/SignUpPage.jsx';
import { useApp, needsScheduleSetup } from '@/context/AppContext.jsx';
import { Spinner } from '@/components/ui/Spinner.jsx';
import { Dashboard } from '@/pages/Dashboard.jsx';
import { PlannerPage } from '@/pages/PlannerPage.jsx';
import { SleepInsights } from '@/pages/SleepInsights.jsx';
import { FocusMode } from '@/pages/FocusMode.jsx';
import { AnalyticsPage } from '@/pages/AnalyticsPage.jsx';
import { CoachPage } from '@/features/assistant/CoachPage.jsx';

function BootShell() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-xs text-slate-500">Loading your week…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (needsScheduleSetup(user)) {
    return <OnboardingWizard />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/sleep" element={<SleepInsights />} />
        <Route path="/focus" element={<FocusMode />} />
        <Route path="/insights" element={<AnalyticsPage />} />
        <Route path="/coach" element={<CoachPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function AppRoutes() {
  return <BootShell />;
}
