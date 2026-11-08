import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Public Pages
import { LandingPage } from "./pages/public/LandingPage";
import { PublicVerifyPage } from "./pages/verify/PublicVerifyPage";
import { VerificationResultPage } from "./pages/verify/VerificationResultPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";

// App Layout & Protected Route Guard
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

// Admin Pages
import { OverviewPage } from "./pages/admin/OverviewPage";
import { IssueCertificatePage } from "./pages/admin/IssueCertificatePage";
import { AllCertificatesPage } from "./pages/admin/AllCertificatesPage";
import { IntegrityLabPage } from "./pages/admin/IntegrityLabPage";
import { RevocationManagementPage } from "./pages/admin/RevocationManagementPage";
import { BlockchainTransactionsPage } from "./pages/admin/BlockchainTransactionsPage";
import { StudentsPage } from "./pages/admin/StudentsPage";
import { VerificationsPage } from "./pages/admin/VerificationsPage";
import { AuditLogsPage } from "./pages/admin/AuditLogsPage";
import { SettingsPage } from "./pages/admin/SettingsPage";

// Student Pages
import { StudentDashboardPage } from "./pages/student/StudentDashboardPage";
import { StudentCertificatesPage } from "./pages/student/StudentCertificatesPage";

export const App: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Unauthenticated Routes */}
      <Route path="/verify" element={<PublicVerifyPage />} />
      <Route path="/verify/:id" element={<VerificationResultPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Root Route: Enterprise Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Protected University Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin", "issuer"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/dashboard" element={<OverviewPage />} />
          <Route path="/admin/issue-certificate" element={<IssueCertificatePage />} />
          <Route path="/admin/certificates" element={<AllCertificatesPage />} />
          <Route path="/admin/integrity-lab" element={<IntegrityLabPage />} />
          <Route path="/admin/revocations" element={<RevocationManagementPage />} />
          <Route path="/admin/transactions" element={<BlockchainTransactionsPage />} />
          <Route path="/admin/students" element={<StudentsPage />} />
          <Route path="/admin/verifications" element={<VerificationsPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Protected Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/certificates" element={<StudentCertificatesPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
