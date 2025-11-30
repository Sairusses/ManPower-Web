import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input, Button, Link, Form, addToast } from "@heroui/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { supabase } from "@/lib/supabase.ts";
import Footer from "@/components/footer.tsx";

export default function Verify2FAPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");

    if (emailParam) {
      setEmail(emailParam);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
      });
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      let { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: "signup",
      });

      if (error && !error.message.includes("signup")) {
        const result = await supabase.auth.verifyOtp({
          email: email,
          token: code,
          type: "email",
        });

        data = result.data;
        error = result.error;
      }

      if (error) {
        addToast({
          title: "Verification failed",
          description: error.message,
          color: "danger",
        });
      } else if (data?.user) {
        const pendingSignup = sessionStorage.getItem("pending_signup");

        if (pendingSignup) {
          try {
            const signupData = JSON.parse(pendingSignup);

            const { error: dbError } = await supabase.from("users").insert({
              id: data.user.id,
              email: signupData.email,
              full_name: signupData.display_name,
              role: signupData.role,
            });

            if (dbError) {
              console.error("Database insert error:", dbError);
            }

            sessionStorage.removeItem("pending_signup");
          } catch (parseError) {
            // eslint-disable-next-line no-console
            console.error("Error parsing pending signup:", parseError);
          }
        }

        addToast({
          title: "Email verified successfully",
          description: "You have been logged in",
          color: "success",
        });
      }
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function resendCode() {
    if (!email) {
      addToast({
        title: "Error",
        description: "Email address is required",
        color: "danger",
      });

      return;
    }

    setIsResending(true);
    try {
      let { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });
      if (error) {
        const result = await supabase.auth.signInWithOtp({
          email: email,
        });

        error = result.error;
      }

      if (error) {
        addToast({
          title: "Error resending code",
          description: error.message,
          color: "danger",
        });
      } else {
        addToast({
          title: "Verification code sent",
          description: "Please check your email for the 6-digit code",
          color: "success",
        });
      }
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message || "Failed to resend code",
        color: "danger",
      });
    } finally {
      setIsResending(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center">
              <Link href="/">
                <img alt="F and R Logo" className="h-30 w-30" src="/logo.png" />
              </Link>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Verify Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter the 6-digit code sent to your email
            </p>
            {email && (
              <p className="mt-1 text-sm text-gray-500 font-medium">{email}</p>
            )}
          </div>

          {/* Verification Form */}
          <Card className="p-5">
            <CardHeader className="flex flex-col">
              <div className="text-3xl font-bold text-center">
                Email Verification
              </div>
              <div className="text-gray-500 text-center">
                Check your inbox for the 6-digit code
              </div>
            </CardHeader>
            <CardBody>
              <Form
                className="w-full flex flex-col gap-4 items-center"
                onSubmit={onSubmit}
              >
                <Input
                  classNames={{
                    input: "text-center text-2xl tracking-widest",
                  }}
                  label="Verification Code"
                  labelPlacement="outside"
                  maxLength={6}
                  name="code"
                  placeholder="Enter 6-digit code"
                  radius="sm"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />

                <Button
                  color="primary"
                  fullWidth={true}
                  isDisabled={code.length !== 6}
                  isLoading={isLoading}
                  type="submit"
                >
                  Verify Email
                </Button>

                <div className="w-full mt-2">
                  <Button
                    fullWidth={true}
                    isDisabled={!email}
                    isLoading={isResending}
                    variant="light"
                    onPress={resendCode}
                  >
                    Resend Code
                  </Button>
                </div>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Wrong email?{" "}
                  <Link
                    className="text-blue-600 hover:text-blue-500 font-bold"
                    href="/auth/signup"
                  >
                    Go back to sign up
                  </Link>
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
