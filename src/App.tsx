import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/ui';
import { LandingPage } from '@/pages/LandingPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { LoginPage } from '@/pages/LoginPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { DashboardLayout } from '@/pages/DashboardLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { NewDecisionPage } from '@/pages/NewDecisionPage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { ChallengePage } from '@/pages/ChallengePage';
import { MyDecisionsPage } from '@/pages/MyDecisionsPage';
import { DecisionDetailPage } from '@/pages/DecisionDetailPage';
import { SecurityPage } from '@/pages/SecurityPage';
import { AccountPage } from '@/pages/AccountPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen message="Checking your session..." />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen message="Checking your session..." />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<PublicOnlyRoute><SignUpPage /></PublicOnlyRoute>} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/verify" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="new" element={<NewDecisionPage />} />
        <Route path="analysis/:id" element={<AnalysisPage />} />
        <Route path="challenge/:id" element={<ChallengePage />} />
        <Route path="decisions" element={<MyDecisionsPage />} />
        <Route path="decisions/:id" element={<DecisionDetailPage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
