import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { supabase } from "@/lib/supabase.ts";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const publicRoutes = ["", "/", "/auth/login", "/auth/signup"];

  const adminRoutes = ["/admin"];
  const applicantRoutes = ["/applicant"];

  useEffect(() => {
    const finishLoading = () => {
      setTimeout(() => setLoading(false), 500);
    };

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!publicRoutes.includes(location.pathname)) {
          navigate("/");
        }
        finishLoading();

        return;
      }

      const role = user?.user_metadata?.role;

      if (
        role === "admin" &&
        applicantRoutes.some((r) => location.pathname.startsWith(r))
      ) {
        navigate("/admin/dashboard");
        finishLoading();

        return;
      }

      if (
        role === "applicant" &&
        adminRoutes.some((r) => location.pathname.startsWith(r))
      ) {
        navigate("/applicant/dashboard");
        finishLoading();

        return;
      }

      if (publicRoutes.includes(location.pathname)) {
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else if (role === "applicant") {
          navigate("/applicant/dashboard");
        }
      }

      finishLoading();
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          if (!publicRoutes.includes(location.pathname)) {
            navigate("/");
          }
        } else {
          const role = session.user?.user_metadata?.role;

          if (
            role === "admin" &&
            applicantRoutes.some((r) => location.pathname.startsWith(r))
          ) {
            navigate("/admin/dashboard");

            return;
          }

          if (
            role === "applicant" &&
            adminRoutes.some((r) => location.pathname.startsWith(r))
          ) {
            navigate("/applicant/dashboard");

            return;
          }

          if (publicRoutes.includes(location.pathname)) {
            if (role === "admin") {
              navigate("/admin/dashboard");
            } else if (role === "applicant") {
              navigate("/applicant/dashboard");
            }
          }
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
