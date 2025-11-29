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

import { supabase } from "@/lib/supabase.ts";

export function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  function onChange(event: any) {
    setFormData((prev: any) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }

  async function signUpApplicant(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.fullName || formData.fullName.trim() === "") {
      addToast({
        title: "Error signing up",
        description: "Please enter your full name",
        color: "danger",
      });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            fullName: formData.fullName,
            role: "applicant",
          },
        },
      });

      if (data) {
        await supabase.from("users").insert({
          id: data.user?.id,
          email: formData.email,
          full_name: formData.fullName,
          role: "applicant",
        });
      }

      if (error) {
        addToast({
          title: "Error signing up",
          description: error.message,
          color: "danger",
        });
      } else {
        addToast({
          title: "Signed up successfully",
          description: `Welcome to F and R ${formData.fullName}`,
          color: "success",
        });
      }
    } catch (error: any) {
      throw error;
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
            <div className="text-3xl font-bold text-center">Applicant Signup</div>
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

              <Button color="primary" fullWidth type="submit">
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
