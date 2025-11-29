import { Outlet } from "react-router-dom";

import AdminNavbar from "@/components/navbar/admin-navbar.tsx";
import Footer from "@/components/footer.tsx";

export default function AdminLayout() {
  return (
    <div className="relative flex flex-col min-h-screen">
      <AdminNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}