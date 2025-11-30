import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { supabase } from "@/lib/supabase.ts";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const publicRoutes = ["", "/", "/auth/login", "/auth/signup", "/auth/verify-2fa"];
  const adminRoutes = ["/admin"];
  const applicantRoutes = ["/applicant"];

  useEffect(() => {
    // @ts-ignore
    const handleRedirect = async (user) => {
      if (!user) {
        if (!publicRoutes.includes(location.pathname)) {
          navigate("/", { replace: true });
        }

        return;
      }

      const role = user?.user_metadata?.role;

      const adminDashboard = "/admin/dashboard";
      const applicantDashboard = "/applicant/dashboard";

      let redirectPath = null;

      if (publicRoutes.includes(location.pathname)) {
        if (role === "admin") {
          redirectPath = adminDashboard;
        } else if (role === "applicant") {
          redirectPath = applicantDashboard;
        }
      } else if (
        role === "admin" &&
        applicantRoutes.some((r) => location.pathname.startsWith(r))
      ) {
        redirectPath = adminDashboard;
      } else if (
        role === "applicant" &&
        adminRoutes.some((r) => location.pathname.startsWith(r))
      ) {
        redirectPath = applicantDashboard;
      }

      if (redirectPath && location.pathname !== redirectPath) {
        navigate(redirectPath, { replace: true });
      }
    };

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await handleRedirect(user);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleRedirect(session?.user);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return <>{children}</>;
}
