import { Link } from "@heroui/link";
import { Button } from "@heroui/react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 w-full">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img alt="F and R Logo" className="h-15 w-15" src="/logo.png" />
              <span className="text-xl font-bold text-gray-900">
                F and R: Job Specialists Inc.
              </span>
            </div>
            <p className="text-gray-600 max-w-md">
              Helping applicants find jobs since 2018. Admins post available
              vacancies, and applicants can apply quickly and securely.
              <br />
              <Link
                className="text-blue-600 underline mt-3"
                href="https://www.facebook.com/dulce.hr.700887"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Button color="primary">Visit our Facebook page</Button>
              </Link>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              For Admins
            </h3>
            <ul className="space-y-2">
              <li>
                <p className="text-gray-600 hover:text-blue-600">Post Jobs</p>
              </li>
              <li>
                <p className="text-gray-600 hover:text-blue-600">
                  Manage Applicants
                </p>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              For Applicants
            </h3>
            <ul className="space-y-2">
              <li>
                <p className="text-gray-600 hover:text-blue-600">Find Jobs</p>
              </li>
              <li>
                <p className="text-gray-600 hover:text-blue-600">
                  Build Profile
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              © 2025 F and R: Job Specialists Inc. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                className="text-gray-600 hover:text-blue-600 text-sm"
                href="/privacy"
              >
                Privacy Policy
              </Link>
              <Link
                className="text-gray-600 hover:text-blue-600 text-sm"
                href="/terms"
              >
                Terms of Service
              </Link>
              <Link
                className="text-gray-600 hover:text-blue-600 text-sm"
                href="/contact"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
