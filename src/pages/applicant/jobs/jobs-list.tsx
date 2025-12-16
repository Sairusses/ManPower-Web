import type { Job } from "@/lib/types";

import { useState, useEffect } from "react";
import {
  Input,
  Select,
  SelectItem,
  Card,
  CardHeader,
  CardBody,
  Link,
  CardFooter,
  Button,
  Chip,
  Spinner,
  Divider,
  addToast,
} from "@heroui/react";
import { Search, Filter, Sparkles, Briefcase } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";

// --- 1. UPDATED CATEGORIES (Matches your "Add Job" keys) ---
const categories = [
  { key: "general_labor", label: "General Labor" },
  { key: "skilled_trades", label: "Skilled Trades" },
  { key: "manufacturing_production", label: "Manufacturing & Production" },
  { key: "warehouse_logistics", label: "Warehouse & Logistics" },
  { key: "drivers_delivery", label: "Drivers & Delivery" },
  { key: "office_admin", label: "Office & Administrative" },
  { key: "accounting_finance", label: "Accounting & Finance" },
  { key: "it_software", label: "IT & Software Development" },
  { key: "engineering_technical", label: "Engineering & Technical Roles" },
  { key: "other", label: "Other" },
];

// --- 2. UPDATED MAPPINGS (Values now match the keys above) ---
const skillCategoryMap: Record<string, string> = {
  // General Labor -> "general_labor"
  "general labor": "general_labor",
  "manual labor": "general_labor",
  construction: "general_labor",
  cleaning: "general_labor",
  janitorial: "general_labor",
  "waste collection": "general_labor",
  farming: "general_labor",
  gardening: "general_labor",
  "food processing": "general_labor",
  packaging: "general_labor",

  // Skilled Trades -> "skilled_trades"
  welding: "skilled_trades",
  electrician: "skilled_trades",
  plumbing: "skilled_trades",
  carpentry: "skilled_trades",
  hvac: "skilled_trades",
  mechanic: "skilled_trades",
  "machine operation": "skilled_trades",
  masonry: "skilled_trades",
  framing: "skilled_trades",
  roofing: "skilled_trades",
  "tile setting": "skilled_trades",
  "building wiring": "skilled_trades",
  automotive: "skilled_trades",
  "heavy equipment operation": "skilled_trades",
  "scaffolding assembly": "skilled_trades",
  "construction painting": "skilled_trades",

  // Manufacturing -> "manufacturing_production"
  manufacturing: "manufacturing_production",
  "assembly line": "manufacturing_production",
  production: "manufacturing_production",
  operations: "manufacturing_production",
  "quality control": "manufacturing_production",
  "machine operating": "manufacturing_production",
  "cnc machine operation": "manufacturing_production",
  electronics: "manufacturing_production",
  "food manufacturing": "manufacturing_production",

  // Warehouse -> "warehouse_logistics"
  forklift: "warehouse_logistics",
  inventory: "warehouse_logistics",
  "order picking": "warehouse_logistics",
  shipping: "warehouse_logistics",
  receiving: "warehouse_logistics",
  "material handling": "warehouse_logistics",
  logistics: "warehouse_logistics",
  "supply chain management": "warehouse_logistics",
  "warehouse management": "warehouse_logistics",

  // Drivers -> "drivers_delivery"
  driving: "drivers_delivery",
  delivery: "drivers_delivery",
  "cdl class a": "drivers_delivery",
  "route sales": "drivers_delivery",
  trucking: "drivers_delivery",
  "light vehicle driving": "drivers_delivery",
  motorcycle: "drivers_delivery",
  "public utility vehicle operation": "drivers_delivery",

  // Office -> "office_admin"
  excel: "office_admin",
  word: "office_admin",
  "data entry": "office_admin",
  administration: "office_admin",
  scheduling: "office_admin",
  receptionist: "office_admin",
  "customer service": "office_admin",
  "project management": "office_admin",
  "virtual assistance": "office_admin",
  "data analysis": "office_admin",
  "time management": "office_admin",
  "organizational skills": "office_admin",
  "clerical skills": "office_admin",

  // Accounting -> "accounting_finance"
  bookkeeping: "accounting_finance",
  accounting: "accounting_finance",
  finance: "accounting_finance",
  payroll: "accounting_finance",
  "accounts payable": "accounting_finance",
  "accounts receivable": "accounting_finance",
  auditing: "accounting_finance",
  "financial analysis": "accounting_finance",
  taxation: "accounting_finance",
  "financial reporting": "accounting_finance",
  budgeting: "accounting_finance",

  // IT -> "it_software"
  javascript: "it_software",
  react: "it_software",
  python: "it_software",
  java: "it_software",
  sql: "it_software",
  "c++": "it_software",
  "c#": "it_software",
  devops: "it_software",
  "quality assurance": "it_software",
  networking: "it_software",
  "cloud computing": "it_software",
  "data science": "it_software",
  cybersecurity: "it_software",
  "machine learning": "it_software",
  "ui/ux design": "it_software",
  "mobile app development": "it_software",
  php: "it_software",

  // Engineering -> "engineering_technical"
  cad: "engineering_technical",
  autocad: "engineering_technical",
  engineering: "engineering_technical",
  mechanical: "engineering_technical",
  electrical: "engineering_technical",
  civil: "engineering_technical",
  "process improvement": "engineering_technical",
  "industrial engineering": "engineering_technical",
  "renewable energy": "engineering_technical",
  architecture: "engineering_technical",
  robotics: "engineering_technical",
  "technical drawing interpretation": "engineering_technical",

  // Other -> "other"
  "communication skills": "other",
  teamwork: "other",
  "problem solving": "other",
  leadership: "other",
  "sales skills": "other",
  negotiation: "other",
  bilingual: "other",
  tagalog: "other",
  bisaya: "other",
  mandarin: "other",
};

const normalize = (v: string) => v.trim().toLowerCase();

const getCategoriesFromSkills = (skills: string[]) => {
  const set = new Set<string>();

  skills.forEach((skill) => {
    const category = skillCategoryMap[normalize(skill)];

    if (category) set.add(category);
  });

  return Array.from(set);
};

export default function ApplicantJobsPage() {
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

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

  // 3. Fetch Recommended Jobs
  useEffect(() => {
    if (!user) return;

    const fetchRecommended = async () => {
      setLoadingRecommended(true);
      try {
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("skills")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.skills || profile.skills.length === 0) {
          setRecommendedJobs([]);
          setLoadingRecommended(false);

          return;
        }

        // Now returns snake_case keys (e.g., "it_software")
        const matchedCategories = getCategoriesFromSkills(profile.skills);

        if (matchedCategories.length === 0) {
          setRecommendedJobs([]);
          setLoadingRecommended(false);

          return;
        }

        // Query matches DB keys exactly
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .eq("status", "open")
          .in("category", matchedCategories)
          .order("created_at", { ascending: false })
          .limit(10);

        if (jobsError) throw jobsError;

        const filteredRecommendations =
          jobsData?.filter((job) => !appliedJobIds.includes(job.id)) || [];

        setRecommendedJobs(filteredRecommendations);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoadingRecommended(false);
      }
    };

    fetchRecommended();
  }, [user, appliedJobIds]);

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
                      "bg-gray-100 data-[hover=true]:bg-gray-200 group-data-[focus=true]:bg-white",
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
        {/* Recommended Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-gray-800">
              Recommended for You
            </h2>
          </div>

          {loadingRecommended ? (
            <div className="w-full flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
              <Spinner color="primary" size="lg" />
              <p className="text-gray-500 mt-4 text-sm">
                Curating jobs based on your profile...
              </p>
            </div>
          ) : recommendedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedJobs.map((job) => (
                <Card
                  key={job.id}
                  className="border-2 border-primary/10 hover:border-primary/30 transition-all shadow-sm hover:shadow-md bg-gradient-to-br from-white to-primary/5 px-4 py-2"
                  shadow="none"
                >
                  <CardHeader className="flex justify-between items-start gap-4 pb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mt-2 line-clamp-1 text-gray-900">
                        {job.title}
                      </h3>
                    </div>
                  </CardHeader>
                  <CardBody className="py-2">
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  </CardBody>
                  <CardFooter className="flex justify-between items-center pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Budget
                      </span>
                      <span className="font-bold text-blue-900 text-lg">
                        ₱{job.budget_min} - ₱{job.budget_max}
                      </span>
                    </div>
                    <Link href={`/applicant/jobs/details?id=${job.id}`}>
                      <Button
                        className="font-medium"
                        color="primary"
                        size="sm"
                        variant="shadow"
                      >
                        View Job
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50 border-dashed border-2 border-gray-200 shadow-none">
              <CardBody className="py-8 text-center">
                <p className="text-gray-600">
                  <Link
                    className="text-primary font-medium hover:underline"
                    href="/applicant/profile"
                  >
                    Complete your profile
                  </Link>{" "}
                  to unlock recommendations matching your skills.
                </p>
              </CardBody>
            </Card>
          )}
        </section>

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
                                color="secondary"
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
                              Est. Budget
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
