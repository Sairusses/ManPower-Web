import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import {
  Briefcase,
  Users,
  MessageSquare,
  Shield,
  Search,
  Zap,
} from "lucide-react";
import {
  Navbar,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarMenu,
} from "@heroui/react";

import Footer from "@/components/footer";

export function indexPage() {
  return (
    <>
      <div className="flex flex-col items-center justify-center w-full">
        {/* Navigation Bar */}
        <Navbar isBordered maxWidth="full" shouldHideOnScroll={true}>
          <NavbarContent justify="start">
            <NavbarMenuToggle className="lg:hidden" />
            <NavbarBrand>
              <Link href="/">
                <img
                  alt="F and R Logo"
                  className="h-8 w-8 mr-2"
                  src="/logo.png"
                />
              </Link>
              <p className="font-bold text-inherit text-2xl">
                F and R: Job Specialists Inc.
              </p>
            </NavbarBrand>
          </NavbarContent>

          <NavbarContent justify="end">
            <NavbarItem className="hidden lg:flex">
              <Link href="/auth/login">
                <Button variant="light">Sign In</Button>
              </Link>
            </NavbarItem>

            <NavbarItem className="hidden lg:flex">
              <Link href="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </NavbarItem>
          </NavbarContent>

          {/* Mobile Menu */}
          <NavbarMenu>
            <NavbarItem className="w-full">
              <Link className="w-full" href="/auth/login">
                <Button className="w-full text-xl py-4" variant="light">
                  Sign In
                </Button>
              </Link>
            </NavbarItem>
            <NavbarItem className="w-full">
              <Link className="w-full" href="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full text-xl py-4">
                  Get Started
                </Button>
              </Link>
            </NavbarItem>
          </NavbarMenu>
        </Navbar>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-white py-20 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Find Jobs. Apply. Get Hired.
                <span className="text-blue-600"> Fast & Easy.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                F and R: Job Specialists Inc. has been connecting qualified
                applicants with companies since 2018. Admins post job vacancies,
                and applicants can browse and apply to positions seamlessly.
                <br />
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    Get Started
                  </Button>
                </Link>
                <a
                  href="https://www.facebook.com/dulce.hr.700887"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Button
                    className="w-full sm:w-auto bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold"
                    size="lg"
                  >
                    Visit FB Page
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose F and R?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                We simplify job searching and hiring by matching applicants with
                verified companies efficiently and securely.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Job Matching
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  Applicants see jobs that fit their skills, experience, and
                  preferences.
                </CardFooter>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Direct Communication
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  Applicants can contact admins or companies directly through
                  the platform.
                </CardFooter>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Secure Platform
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  Applicant and company data are handled securely, fully
                  compliant with HR best practices.
                </CardFooter>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Verified Applicants
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  Every applicant is verified to ensure authenticity and
                  reliability for hiring companies.
                </CardFooter>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Fast Job Posting
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  Admins can post job vacancies quickly, letting applicants
                  apply immediately.
                </CardFooter>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Job Management
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  Admins manage job postings, track applications, and organize
                  hiring efficiently.
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 py-20 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Career?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of applicants and companies who trust F and R: Job
              Specialists Inc.
            </p>
            <Link href="/auth/signup">
              <Button
                className="bg-white text-blue-600 hover:bg-gray-50"
                size="lg"
              >
                Sign Up Today
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
