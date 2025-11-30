import { Route, Routes } from "react-router-dom";
import { ToastProvider } from "@heroui/toast";

import { AuthProvider } from "@/components/auth-provider.tsx";
// Auth
import LoginPage from "@/pages/auth/login.tsx";
import SignupPage from "@/pages/auth/signup.tsx";
import Verify2FAPage from "@/pages/auth/verify-2fa.tsx";
// Public
import IndexPage from "@/pages/index";
import MessagesPage from "@/pages/messages/messages.tsx";
// Admin Pages
import AdminLayout from "@/layouts/admin-layout.tsx";
import AdminDashboard from "@/pages/admin/admin-dashboard.tsx";
import AdminProfile from "@/pages/admin/admin-profile.tsx";
import JobsList from "@/pages/admin/jobs/jobs-list.tsx";
import PostJob from "@/pages/admin/jobs/post-job.tsx";
import AdminJobsDetails from "@/pages/admin/jobs/admin-jobs-details.tsx";
import EditJob from "@/pages/admin/jobs/edit-jobs.tsx";
import AdminProposalsList from "@/pages/admin/proposals/admin-proposals-list.tsx";
import AdminProposalDetails from "@/pages/admin/proposals/admin-proposal-details.tsx";
import AdminContracts from "@/pages/admin/contracts/admin-contracts.tsx";
import AdminContractDetailsPage from "@/pages/admin/contracts/admin-contract-details.tsx";
// Applicant Pages
import ApplicantLayout from "@/layouts/applicant-layout.tsx";
import ApplicantDashboard from "@/pages/applicant/applicant-dashboard.tsx";
import ApplicantProfile from "@/pages/applicant/applicant-profile.tsx";
import ApplicantJobsPage from "@/pages/applicant/jobs/jobs-list.tsx";
import ApplicantJobDetailsPage from "@/pages/applicant/jobs/applicant-jobs-details.tsx";
import ApplicantProposalsList from "@/pages/applicant/proposals/applicant-proposals-list.tsx";
import ApplicantProposalsDetails from "@/pages/applicant/proposals/applicant-proposals-details.tsx";
import ApplicantContracts from "@/pages/applicant/contracts/applicant-contracts.tsx";
import ApplicantContractDetails from "@/pages/applicant/contracts/applicant-contract-details.tsx";

function App() {
  return (
    <AuthProvider>
      <ToastProvider />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route element={<IndexPage />} path="/" />
        <Route element={<LoginPage />} path="/auth/login" />
        <Route element={<SignupPage />} path="/auth/signup" />
        <Route element={<Verify2FAPage />} path="/auth/verify-2fa" />
        {/* ADMIN ROUTES */}
        <Route element={<AdminLayout />} path="/admin">
          <Route element={<AdminDashboard />} path="dashboard" />
          <Route element={<AdminProfile />} path="profile" />
          <Route element={<MessagesPage />} path="messages" />
          <Route path="jobs">
            <Route index element={<JobsList />} />
            <Route element={<PostJob />} path="post" />
            <Route element={<AdminJobsDetails />} path="details" />
            <Route element={<EditJob />} path="edit/:id" />
          </Route>
          <Route path="proposals">
            <Route index element={<AdminProposalsList />} />
            <Route element={<AdminProposalDetails />} path="details" />
          </Route>
          <Route path="contracts">
            <Route index element={<AdminContracts />} />
            <Route element={<AdminContractDetailsPage />} path="details" />
          </Route>
        </Route>

        {/* APPLICANT ROUTES */}
        <Route element={<ApplicantLayout />} path="/applicant">
          <Route element={<ApplicantDashboard />} path="dashboard" />
          <Route element={<ApplicantProfile />} path="profile" />
          <Route element={<MessagesPage />} path="messages" />
          <Route path="jobs">
            <Route index element={<ApplicantJobsPage />} />
            <Route element={<ApplicantJobDetailsPage />} path="details" />
          </Route>
          <Route path="proposals">
            <Route index element={<ApplicantProposalsList />} />
            <Route element={<ApplicantProposalsDetails />} path="details" />
          </Route>
          <Route path="contracts">
            <Route index element={<ApplicantContracts />} />
            <Route element={<ApplicantContractDetails />} path="details" />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
