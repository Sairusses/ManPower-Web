import { Outlet } from "react-router-dom";

import Footer from "@/components/footer.tsx";
import ApplicantNavbar from "@/components/navbar/applicant-navbar.tsx";

export default function ApplicantLayout() {
  return (
    <div className="relative flex flex-col min-h-screen">
      <ApplicantNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
