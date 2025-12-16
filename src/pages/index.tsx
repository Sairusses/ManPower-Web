import type { Job } from "@/lib/types";

import { useState, useEffect } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Link,
  Button,
  Chip,
  Spinner,
  Divider,
  addToast,
} from "@heroui/react";
import {
  Search,
  Filter,
  Sparkles,
  Briefcase,
  UserPlus,
  LogIn,
} from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";

// --- Static Data ---
const categories = [
  { key: "general labor", label: "General Labor" },
  { key: "skilled trades", label: "Skilled Trades" },
  { key: "manufacturing production", label: "Manufacturing & Production" },
  { key: "warehouse logistics", label: "Warehouse & Logistics" },
  { key: "drivers delivery", label: "Drivers & Delivery" },
  { key: "office administrative", label: "Office & Administrative" },
  { key: "accounting finance", label: "Accounting & Finance" },
  { key: "it software development", label: "IT & Software Development" },
  { key: "engineering technical", label: "Engineering & Technical Roles" },
  { key: "other", label: "Other" },
];

export default function Index() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const supabase = getSupabaseClient();

  // Fetch Public Open Jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
        );
      }
      if (categoryFilter) query = query.eq("category", categoryFilter);
      if (minBudget) query = query.gte("budget_min", Number(minBudget));
      if (maxBudget) query = query.lte("budget_max", Number(maxBudget));

      const { data, error } = await query;

      if (error) {
        addToast({
          title: "Error fetching jobs",
          description: error.message,
          color: "danger",
        });
      }

      setJobs(data || []);
      setLoadingJobs(false);
    };

    fetchJobs();
  }, [searchTerm, categoryFilter, minBudget, maxBudget]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* --- Navigation Bar --- */}
      <Navbar
        isBordered
        className="bg-white"
        maxWidth="xl"
        onMenuOpenChange={setIsMenuOpen}
      >
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="lg:hidden"
          />
          <NavbarBrand>
            <Link className="flex items-center gap-2 text-inherit" href="/">
              <div className="p-1 rounded-lg">
                <img
                  alt="F and R Logo"
                  className="h-8 w-8 mr-2"
                  src="/logo.png"
                />
              </div>
              <p className="font-bold text-xl sm:text-2xl tracking-tight text-gray-900">
                F<span className="text-primary">&</span>R
                <span className="hidden sm:inline font-normal text-gray-500 text-lg ml-2">
                  Job Specialists
                </span>
              </p>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        {/* Desktop Auth Buttons */}
        <NavbarContent className="hidden lg:flex gap-4" justify="end">
          <NavbarItem>
            <Link
              className="text-gray-600 hover:text-gray-900 font-medium"
              href="/auth/login"
            >
              Sign In
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Button
              as={Link}
              className="font-semibold"
              color="primary"
              href="/auth/signup"
              startContent={<UserPlus className="w-4 h-4" />}
              variant="solid"
            >
              Get Started
            </Button>
          </NavbarItem>
        </NavbarContent>

        {/* Mobile Menu */}
        <NavbarMenu className="pt-6 bg-white/95 backdrop-blur-md">
          <NavbarMenuItem className="mb-4">
            <Button
              as={Link}
              className="w-full justify-start text-lg h-12"
              href="/auth/login"
              startContent={<LogIn className="w-5 h-5" />}
              variant="bordered"
            >
              Sign In
            </Button>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Button
              as={Link}
              className="w-full justify-start text-lg h-12"
              color="primary"
              href="/auth/signup"
              startContent={<UserPlus className="w-5 h-5" />}
            >
              Create Account
            </Button>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>

      {/* --- Page Header & Filters --- */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Browse Opportunities
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl">
            Explore open positions. Sign up to apply and get personalized job
            recommendations matching your skills.
          </p>

          {/* Filters Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Search */}
            <div className="lg:col-span-4">
              <Input
                classNames={{
                  inputWrapper:
                    "bg-gray-100 hover:bg-gray-200 focus-within:bg-white transition-colors",
                }}
                placeholder="Search jobs..."
                radius="sm"
                size="lg"
                startContent={<Search className="w-4 h-4 text-gray-500" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="lg:col-span-3">
              <Select
                classNames={{
                  trigger: "bg-gray-100 hover:bg-gray-200",
                }}
                items={categories}
                placeholder="Category"
                radius="sm"
                selectedKeys={categoryFilter ? [categoryFilter] : []}
                size="lg"
                startContent={<Briefcase className="w-4 h-4 text-gray-500" />}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
            </div>

            {/* Budget Range */}
            <div className="lg:col-span-5 flex gap-2">
              <div className="flex-1">
                <Input
                  classNames={{
                    inputWrapper:
                      "bg-gray-100 hover:bg-gray-200 focus-within:bg-white",
                  }}
                  placeholder="Min Budget"
                  radius="sm"
                  size="lg"
                  startContent={
                    <span className="text-small text-gray-500">₱</span>
                  }
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                />
              </div>
              <div className="flex items-center text-gray-400">-</div>
              <div className="flex-1">
                <Input
                  classNames={{
                    inputWrapper:
                      "bg-gray-100 hover:bg-gray-200 focus-within:bg-white",
                  }}
                  placeholder="Max Budget"
                  radius="sm"
                  size="lg"
                  startContent={
                    <span className="text-small text-gray-500">₱</span>
                  }
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* --- Recommended Section (Gated) --- */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-gray-800">
              Recommended for You
            </h2>
          </div>

          <Card className="p-8 sm:p-10 bg-white border-2 border-dashed border-gray-300 shadow-none text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Unlock Personalized Matches
            </h3>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto text-base">
              We can&#39;t recommend jobs because we don&#39;t know your skills
              yet. Create an account to get job alerts tailored specifically to
              your expertise.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                as={Link}
                className="font-semibold px-8"
                color="primary"
                href="/auth/signup"
                size="lg"
                startContent={<UserPlus className="w-5 h-5" />}
                variant="shadow"
              >
                Sign Up Now
              </Button>
            </div>
          </Card>
        </section>

        <Divider className="my-10" />

        {/* --- All Jobs Section --- */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Latest Opportunities
            </h2>
            <span className="text-sm text-gray-500 hidden sm:block font-medium">
              Showing {jobs.length} open positions
            </span>
          </div>

          {loadingJobs ? (
            <div className="w-full flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-100 shadow-sm">
              <Spinner color="primary" size="lg" />
              <p className="text-gray-500 mt-4 text-sm font-medium">
                Finding the best jobs...
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <Card
                    key={job.id}
                    className="w-full transition-all hover:shadow-lg hover:border-primary/50 border border-gray-200 bg-white group"
                    radius="lg"
                    shadow="sm"
                  >
                    <CardBody className="p-0">
                      <div className="flex flex-col sm:flex-row gap-5 p-5">
                        {/* Main Content */}
                        <div className="flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg sm:text-xl text-gray-900 group-hover:text-primary transition-colors">
                                {job.title}
                              </h3>
                              {/* Mobile Price */}
                              <span className="sm:hidden font-bold text-primary-700 text-sm bg-primary-50 px-2 py-1 rounded">
                                ₱{Number(job.budget_min).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              <Chip
                                classNames={{
                                  base: "bg-gray-100 text-gray-600 font-medium",
                                  content: "font-semibold",
                                }}
                                size="sm"
                                variant="flat"
                              >
                                {job.category}
                              </Chip>
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                              {job.description}
                            </p>
                          </div>
                        </div>

                        {/* Action Side (Right/Bottom) */}
                        <div className="border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 flex flex-row sm:flex-col justify-between items-center sm:items-end min-w-[170px]">
                          <div className="hidden sm:flex flex-col items-end text-right mb-auto">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                              Budget
                            </span>
                            <span className="font-bold text-lg text-gray-900">
                              ₱{Number(job.budget_min).toLocaleString()} - ₱
                              {Number(job.budget_max).toLocaleString()}
                            </span>
                          </div>

                          <div className="w-full sm:w-auto mt-auto">
                            <Button
                              fullWidth
                              as={Link}
                              className="font-medium shadow-md group-hover:shadow-lg transition-all"
                              color="primary"
                              endContent={<UserPlus className="w-4 h-4" />}
                              href="/auth/signup"
                              size="md"
                              variant="solid"
                            >
                              Sign Up to Apply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200 border-dashed text-center px-4">
                  <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <Filter className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No jobs found
                  </h3>
                  <p className="text-gray-500 max-w-sm mt-2">
                    We couldn&#39;t find any jobs matching your filters. Try
                    adjusting your search terms.
                  </p>
                  <Button
                    className="mt-4"
                    color="primary"
                    variant="light"
                    onPress={() => {
                      setSearchTerm("");
                      setCategoryFilter("");
                      setMinBudget("");
                      setMaxBudget("");
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
