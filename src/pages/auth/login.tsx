import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input, Button, Link, Form, addToast } from "@heroui/react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase.ts";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">(
    "password",
  );
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  function onChange(event: any) {
    setFormData((prevFormData: any) => {
      return {
        ...prevFormData,
        [event.target.name]: event.target.value,
      };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (loginMethod === "password") {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          addToast({
            title: "Error logging in",
            description: error.message,
            color: "danger",
          });
        } else {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          const fullName = user?.user_metadata?.fullName || "User";

          addToast({
            title: "Logged in successfully",
            description: `Welcome back to F and R, ${fullName}!`,
            color: "success",
          });
        }
      } else {
        // Email OTP login - sends 6-digit code
        const { error } = await supabase.auth.signInWithOtp({
          email: formData.email,
        });

        if (error) {
          addToast({
            title: "Error sending code",
            description: error.message,
            color: "danger",
          });
        } else {
          addToast({
            title: "Verification code sent",
            description: "Please check your email for the 6-digit code",
            color: "success",
          });
          navigate(
            `/auth/verify-2fa?email=${encodeURIComponent(formData.email)}`,
          );
        }
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

  return (
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
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your F and R account
          </p>
        </div>
        {/* Login Form */}
        <Card className="p-5">
          <CardHeader className="flex flex-col">
            <div className="text-3xl font-bold text-center">Sign In</div>
            <div className="text-gray-500 text-center">
              Enter your credentials to access your account
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2 mb-4">
              <Button
                className="flex-1"
                color={loginMethod === "password" ? "primary" : "default"}
                size="sm"
                variant={loginMethod === "password" ? "solid" : "bordered"}
                onPress={() => setLoginMethod("password")}
              >
                Password
              </Button>
              <Button
                className="flex-1"
                color={loginMethod === "otp" ? "primary" : "default"}
                size="sm"
                variant={loginMethod === "otp" ? "solid" : "bordered"}
                onPress={() => setLoginMethod("otp")}
              >
                Email Code
              </Button>
            </div>

            <Form
              className="w-full flex flex-col gap-4 items-center"
              onSubmit={onSubmit}
            >
              <Input
                isRequired
                errorMessage="Please enter a valid email"
                label="Email"
                labelPlacement="outside"
                name="email"
                placeholder="Enter your email"
                radius="sm"
                type="email"
                value={formData.email}
                onChange={onChange}
              />

              {loginMethod === "password" && (
                <Input
                  isRequired
                  errorMessage="Please enter your password"
                  label="Password"
                  labelPlacement="outside"
                  name="password"
                  placeholder="Enter your password"
                  radius="sm"
                  type="password"
                  value={formData.password}
                  onChange={onChange}
                />
              )}

              {loginMethod === "otp" && (
                <p className="text-sm text-gray-500 text-center">
                  We&apos;ll send a 6-digit verification code to your email
                  address
                </p>
              )}

              <Button
                color="primary"
                fullWidth={true}
                isDisabled={
                  !formData.email ||
                  (loginMethod === "password" && !formData.password)
                }
                isLoading={isLoading}
                type="submit"
              >
                {loginMethod === "password"
                  ? "Sign In"
                  : "Send Verification Code"}
              </Button>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&#39;t have an account?{" "}
                <Link
                  className="text-blue-600 hover:text-blue-500 font-bold"
                  href="/auth/signup"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
