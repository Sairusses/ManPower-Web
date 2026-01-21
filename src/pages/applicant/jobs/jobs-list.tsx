import type { Job } from "@/lib/types";

import { useState, useEffect } from "react";
import {
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Link,
  Button,
  Chip,
  Divider,
  addToast,
} from "@heroui/react";
import { Search, Filter, Briefcase } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";
import JobFeed from "@/components/jobfeed.tsx";

// --- 1. UPDATED CATEGORIES (Matches your "Add Job" keys) ---
const categories = [
  { key: "general_labor", label: "General Labor" },
  { key: "skilled_trades", label: "Skilled Trades" },
  { key: "manufacturing_production", label: "Manufacturing & Production" },
  { key: "warehouse_logistics", label: "Warehouse & Logistics" },
  { key: "drivers_delivery", label: "Drivers & Delivery" },
  { key: "office_admin", label: "Office & Administrative" },
  { key: "accounting finance", label: "Accounting & Finance" },
  { key: "it_software", label: "IT & Software Development" },
  { key: "engineering_technical", label: "Engineering & Technical Roles" },
  { key: "other", label: "Other" },
];

export default function ApplicantJobsPage() {
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const supabase = getSupabaseClient();

  // 1. Fetch Authenticated User
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        addToast({
          title: "Error fetching user",
          description: error.message,
          color: "danger",
        });
      } else {
        setUser(data.user);
      }
    };

    fetchUser();
  }, []);

  // 2. Fetch Applied Jobs
  useEffect(() => {
    if (!user) return;
    const fetchApplications = async () => {
      const { data: proposals } = await supabase
        .from("proposals")
        .select("job_id")
        .eq("applicant_id", user.id);

      const { data: contracts } = await supabase
        .from("contracts")
        .select("job_id")
        .eq("applicant_id", user.id);

      const appliedIds = [
        ...(proposals?.map((p) => p.job_id) || []),
        ...(contracts?.map((c) => c.job_id) || []),
      ];

      setAppliedJobIds([...new Set(appliedIds)]);
    };

    fetchApplications();
  }, [user]);

  // 4. Fetch All Jobs
  useEffect(() => {
    const fetchJobs = async () => {
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

      const { data } = await query;

      setJobs(data || []);
    };

    fetchJobs();
  }, [searchTerm, categoryFilter, minBudget, maxBudget]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Browse Jobs
          </h1>
          <p className="mt-2 text-gray-500">
            Find the perfect project that matches your skills.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <Input
                classNames={{
                  inputWrapper:
                    "bg-gray-100 data-[hover=true]:bg-gray-200 group-data-[focus=true]:bg-white",
                }}
                placeholder="Search jobs..."
                radius="sm"
                size="lg"
                startContent={<Search className="w-4 h-4 text-gray-500" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="lg:col-span-3">
              <Select
                classNames={{
                  trigger: "bg-gray-100 data-[hover=true]:bg-gray-200",
                }}
                items={categories}
                placeholder="All Categories"
                radius="sm"
                selectedKeys={categoryFilter ? [categoryFilter] : []}
                size="lg"
                startContent={<Briefcase className="w-4 h-4 text-gray-500" />}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
            </div>
            <div className="lg:col-span-5 flex gap-2">
              <div className="flex-1">
                <Input
                  classNames={{
                    inputWrapper:
                      "bg-gray-100 data-[hover=true]:bg-gray-200 group-data-[focus=true]:bg-white",
                  }}
                  placeholder="Min Salary"
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
                      "bg-gray-100 data-[hover=true]:bg-gray-200 group-data-[focus=true]:bg-white",
                  }}
                  placeholder="Max Salary"
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
        {user && <JobFeed userId={user.id} />}
        <Divider className="my-8" />
        {/* All Jobs Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Latest Opportunities
            </h2>
            <span className="text-sm text-gray-500 hidden sm:block">
              Showing {jobs.length} results
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {jobs.length > 0 ? (
              jobs.map((job) => {
                const alreadyApplied = appliedJobIds.includes(job.id);
                // Look up readable label for chips
                const categoryLabel =
                  categories.find((c) => c.key === job.category)?.label ||
                  job.category;

                return (
                  <Card
                    key={job.id}
                    className={`w-full transition-all hover:shadow-md ${
                      alreadyApplied ? "opacity-75 bg-gray-50" : "bg-white"
                    }`}
                    shadow="sm"
                  >
                    <CardBody className="p-0 sm:p-2">
                      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-2">
                        <div className="flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-lg text-gray-900 mb-1">
                                {job.title}
                              </h3>
                              <span className="sm:hidden font-bold text-blue-900 text-sm">
                                ₱{job.budget_min} - {job.budget_max}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              <Chip
                                className="border-none pl-0"
                                color="primary"
                                size="sm"
                                variant="dot"
                              >
                                {categoryLabel}
                              </Chip>
                              {alreadyApplied && (
                                <Chip color="success" size="sm" variant="flat">
                                  Applied
                                </Chip>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2">
                              {job.description}
                            </p>
                          </div>
                        </div>

                        <div className="border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 flex flex-row sm:flex-col justify-between items-center sm:items-end min-w-[160px]">
                          <div className="hidden sm:flex flex-col items-end text-right">
                            <span className="text-xs text-gray-400">
                              Est. Salary
                            </span>
                            <span className="font-bold text-lg text-blue-900">
                              ₱{Number(job.budget_min).toLocaleString()} - ₱
                              {Number(job.budget_max).toLocaleString()}
                            </span>
                          </div>

                          <div className="w-full sm:w-auto mt-auto">
                            {alreadyApplied ? (
                              <Button
                                disabled
                                fullWidth
                                color="default"
                                size="md"
                                startContent={
                                  <span className="text-xl">✓</span>
                                }
                                variant="flat"
                              >
                                Applied
                              </Button>
                            ) : (
                              <Link
                                className="w-full block"
                                href={`/applicant/jobs/details?id=${job.id}`}
                              >
                                <Button
                                  fullWidth
                                  className="font-medium hover:bg-primary hover:text-white"
                                  color="primary"
                                  size="md"
                                  variant="ghost"
                                >
                                  Details
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200 border-dashed text-center px-4">
                <div className="bg-gray-50 p-4 rounded-full mb-4">
                  <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No jobs found
                </h3>
                <p className="text-gray-500 max-w-sm mt-2">
                  We couldn&#39;t find any jobs matching your filters.
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
        </section>
      </div>
    </div>
  );
}
