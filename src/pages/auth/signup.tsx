import {
  Card,
  CardBody,
  CardHeader,
  Form,
  Input,
  Button,
  Link,
  addToast,
} from "@heroui/react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase.ts";

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Password requirements validation
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword;

  function onChange(event: any) {
    setFormData((prev: any) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }

  async function signUpApplicant(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.fullName || formData.fullName.trim() === "") {
      addToast({
        title: "Error signing up",
        description: "Please enter your full name",
        color: "danger",
      });
      setIsLoading(false);

      return;
    }

    // Validate password requirements
    if (!isPasswordValid) {
      addToast({
        title: "Invalid password",
        description: "Password does not meet all requirements",
        color: "danger",
      });
      setIsLoading(false);

      return;
    }

    // Validate password match
    if (!passwordsMatch) {
      addToast({
        title: "Passwords do not match",
        description: "Please make sure both passwords are the same",
        color: "danger",
      });
      setIsLoading(false);

      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.fullName,
            role: "applicant",
          },
          emailRedirectTo: undefined, // Don't use redirect, we'll use OTP code
        },
      });

      if (error) {
        addToast({
          title: "Error signing up",
          description: error.message,
          color: "danger",
        });
        setIsLoading(false);

        return;
      }

      if (data?.session) {
        await supabase.auth.signOut();
      }

      // Store signup data in sessionStorage to use after verification
      if (data?.user) {
        sessionStorage.setItem(
          "pending_signup",
          JSON.stringify({
            userId: data.user.id,
            email: formData.email,
            display_name: formData.fullName,
            role: "applicant",
          }),
        );
      }

      addToast({
        title: "Verification code sent",
        description:
          "Please check your email for the 6-digit verification code",
        color: "success",
      });

      // Redirect to verification page
      navigate(`/auth/verify-2fa?email=${encodeURIComponent(formData.email)}`);
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-1 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <img alt="F and R Logo" className="h-30 w-30" src="/logo.png" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Join F and R
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account and apply for jobs
          </p>
        </div>

        {/* Signup Card */}
        <Card className="p-5">
          <CardHeader className="flex flex-col">
            <div className="text-3xl font-bold text-center">
              Applicant Signup
            </div>
            <div className="text-gray-500 text-center">
              Fill in your details to create an applicant account
            </div>
          </CardHeader>

          <CardBody className="w-full">
            <Form className="flex flex-col gap-4" onSubmit={signUpApplicant}>
              <Input
                label="Full Name"
                labelPlacement="outside"
                name="fullName"
                placeholder="Enter your full name"
                radius="sm"
                type="text"
                value={formData.fullName}
                onChange={onChange}
              />

              <Input
                label="Email"
                labelPlacement="outside"
                name="email"
                placeholder="Enter your email"
                radius="sm"
                type="email"
                value={formData.email}
                onChange={onChange}
              />

              <Input
                label="Password"
                labelPlacement="outside"
                name="password"
                placeholder="Enter your password"
                radius="sm"
                type="password"
                value={formData.password}
                onChange={onChange}
              />

              {/* Password Requirements */}
              {formData.password && (
                <div className="text-sm space-y-1">
                  <p className="text-gray-600 font-medium mb-2">
                    Password Requirements:
                  </p>
                  <div className="space-y-1">
                    <div
                      className={`flex items-center gap-2 ${
                        passwordRequirements.minLength
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      <span>{passwordRequirements.minLength ? "✓" : "○"}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        passwordRequirements.hasUpperCase
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      <span>
                        {passwordRequirements.hasUpperCase ? "✓" : "○"}
                      </span>
                      <span>One uppercase letter</span>
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        passwordRequirements.hasLowerCase
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      <span>
                        {passwordRequirements.hasLowerCase ? "✓" : "○"}
                      </span>
                      <span>One lowercase letter</span>
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        passwordRequirements.hasNumber
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      <span>{passwordRequirements.hasNumber ? "✓" : "○"}</span>
                      <span>One number</span>
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        passwordRequirements.hasSpecialChar
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      <span>
                        {passwordRequirements.hasSpecialChar ? "✓" : "○"}
                      </span>
                      <span>One special character</span>
                    </div>
                  </div>
                </div>
              )}

              <Input
                errorMessage={
                  formData.confirmPassword && !passwordsMatch
                    ? "Passwords do not match"
                    : undefined
                }
                label="Confirm Password"
                labelPlacement="outside"
                name="confirmPassword"
                placeholder="Confirm your password"
                radius="sm"
                type="password"
                value={formData.confirmPassword}
                onChange={onChange}
              />

              <Button
                fullWidth
                color="primary"
                isDisabled={
                  !isPasswordValid ||
                  !passwordsMatch ||
                  !formData.fullName ||
                  !formData.email
                }
                isLoading={isLoading}
                type="submit"
              >
                Sign Up
              </Button>
            </Form>

            <div className="mt-2 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  className="text-blue-600 hover:text-blue-500 font-bold"
                  href="/auth/login"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
