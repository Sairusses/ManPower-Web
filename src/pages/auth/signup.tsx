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
  });
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.fullName,
            role: "applicant",
          },
        },
      });

      if (data?.user) {
        try {
          await supabase.from("users").insert({
            id: data.user.id,
            email: formData.email,
            display_name: formData.fullName,
            role: "applicant",
          });
        } catch (dbError) {
          console.error("Database insert error:", dbError);
        }
      }

      if (error) {
        addToast({
          title: "Error signing up",
          description: error.message,
          color: "danger",
        });
      } else {
        addToast({
          title: "Account created successfully",
          description: "Please check your email for the 6-digit verification code",
          color: "success",
        });
        // Redirect to verification page
        navigate(`/auth/verify-2fa?email=${encodeURIComponent(formData.email)}`);
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
                onChange={onChange}
              />

              <Input
                label="Email"
                labelPlacement="outside"
                name="email"
                placeholder="Enter your email"
                radius="sm"
                type="email"
                onChange={onChange}
              />

              <Input
                label="Password"
                labelPlacement="outside"
                name="password"
                placeholder="Enter your password"
                radius="sm"
                type="password"
                onChange={onChange}
              />

              <Button fullWidth color="primary" type="submit" isLoading={isLoading}>
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
