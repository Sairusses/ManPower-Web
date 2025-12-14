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

// --- Mappings (Kept same as provided) ---
const skillCategoryMap: Record<string, string> = {
  // General Labor
  "general labor": "general labor",
  "manual labor": "general labor",
  construction: "general labor",
  cleaning: "general labor",
  janitorial: "general labor",
  "waste collection": "general labor",
  farming: "general labor",
  gardening: "general labor",
  "food processing": "general labor",
  packaging: "general labor",

  // Skilled Trades
  welding: "skilled trades",
  electrician: "skilled trades",
  plumbing: "skilled trades",
  carpentry: "skilled trades",
  hvac: "skilled trades",
  mechanic: "skilled trades",
  "machine operation": "skilled trades",
  masonry: "skilled trades",
  framing: "skilled trades",
  roofing: "skilled trades",
  "tile setting": "skilled trades",
  "building wiring": "skilled trades",
  automotive: "skilled trades",
  "heavy equipment operation": "skilled trades",
  "scaffolding assembly": "skilled trades",
  "construction painting": "skilled trades",

  // Manufacturing & Production
  manufacturing: "manufacturing production",
  "assembly line": "manufacturing production",
  production: "manufacturing production",
  operations: "manufacturing production",
  "quality control": "manufacturing production",
  "machine operating": "manufacturing production",
  "cnc machine operation": "manufacturing production",
  electronics: "manufacturing production",
  "food manufacturing": "manufacturing production",

  // Warehouse & Logistics
  forklift: "warehouse logistics",
  inventory: "warehouse logistics",
  "order picking": "warehouse logistics",
  shipping: "warehouse logistics",
  receiving: "warehouse logistics",
  "material handling": "warehouse logistics",
  logistics: "warehouse logistics",
  "supply chain management": "warehouse logistics",
  "warehouse management": "warehouse logistics",

  // Drivers & Delivery
  driving: "drivers delivery",
  delivery: "drivers delivery",
  "cdl class a": "drivers delivery",
  "route sales": "drivers delivery",
  trucking: "drivers delivery",
  "light vehicle driving": "drivers delivery",
  motorcycle: "drivers delivery",
  "public utility vehicle operation": "drivers delivery",

  // Office & Administrative
  excel: "office administrative",
  word: "office administrative",
  "data entry": "office administrative",
  administration: "office administrative",
  scheduling: "office administrative",
  receptionist: "office administrative",
  "customer service": "office administrative",
  "project management": "office administrative",
  "virtual assistance": "office administrative",
  "data analysis": "office administrative",
  "time management": "office administrative",
  "organizational skills": "office administrative",
  "clerical skills": "office administrative",

  // Accounting & Finance
  bookkeeping: "accounting finance",
  accounting: "accounting finance",
  finance: "accounting finance",
  payroll: "accounting finance",
  "accounts payable": "accounting finance",
  "accounts receivable": "accounting finance",
  auditing: "accounting finance",
  "financial analysis": "accounting finance",
  taxation: "accounting finance",
  "financial reporting": "accounting finance",
  budgeting: "accounting finance",

  // IT & Software Development
  javascript: "it software development",
  react: "it software development",
  python: "it software development",
  java: "it software development",
  sql: "it software development",
  "c++": "it software development",
  "c#": "it software development",
  devops: "it software development",
  "quality assurance": "it software development",
  networking: "it software development",
  "cloud computing": "it software development",
  "data science": "it software development",
  cybersecurity: "it software development",
  "machine learning": "it software development",
  "ui/ux design": "it software development",
  "mobile app development": "it software development",
  php: "it software development",

  // Engineering & Technical
  cad: "engineering technical",
  autocad: "engineering technical",
  engineering: "engineering technical",
  mechanical: "engineering technical",
  electrical: "engineering technical",
  civil: "engineering technical",
  "process improvement": "engineering technical",
  "industrial engineering": "engineering technical",
  "renewable energy": "engineering technical",
  architecture: "engineering technical",
  robotics: "engineering technical",
  "technical drawing interpretation": "engineering technical",

  // Other
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

  // 2. Fetch Applied Jobs (Proposals + Contracts)
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

      // Use Set to remove duplicates
      setAppliedJobIds([...new Set(appliedIds)]);
    };

    fetchApplications();
  }, [user]);

  // 3. Fetch Recommended Jobs (The Fix)
  useEffect(() => {
    // Only run if we have a user and have finished loading applied IDs (to avoid flash of applied jobs)
    if (!user) return;

    const fetchRecommended = async () => {
      setLoadingRecommended(true);

      try {
        // A. Get User Skills from Public Profile
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

        // B. Map Skills to Categories
        const matchedCategories = getCategoriesFromSkills(profile.skills);

        if (matchedCategories.length === 0) {
          setRecommendedJobs([]);
          setLoadingRecommended(false);

          return;
        }

        // C. Fetch Jobs in those categories
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .eq("status", "open")
          .in("category", matchedCategories)
          .order("created_at", { ascending: false })
          .limit(10); // Limit to top 10 recommended

        if (jobsError) throw jobsError;

        // D. Filter out jobs the user has already applied to
        // Note: We do NOT filter against the main 'jobs' list here.
        // Recommended jobs should appear even if they are in the 'Browse' list.
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
  }, [user, appliedJobIds]); // Dependency on appliedJobIds ensures list updates if user applies

  // 4. Fetch All/Filtered Jobs
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
  }, [searchTerm, categoryFilter, minBudget, maxBudget]); // Removed 'user' dependency as public jobs don't strictly depend on user ID

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Browse Jobs
          </h1>
          <p className="mt-2 text-gray-500">
            Find the perfect project that matches your skills.
          </p>

          {/* Filters Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Search - Spans 4 columns on large screens */}
            <div className="lg:col-span-4">
              <Input
                classNames={{
                  inputWrapper: "bg-gray-100 data-[hover=true]:bg-gray-200 group-data-[focus=true]:bg-white",
                }}
                placeholder="Search jobs by title or keyword..."
                startContent={<Search className="w-4 h-4 text-gray-500" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="lg"
                radius="sm"
              />
            </div>

            {/* Category - Spans 3 columns */}
            <div className="lg:col-span-3">
              <Select
                items={categories}
                placeholder="All Categories"
                selectedKeys={categoryFilter ? [categoryFilter] : []}
                startContent={<Briefcase className="w-4 h-4 text-gray-500" />}
                onChange={(e) => setCategoryFilter(e.target.value)}
                size="lg"
                radius="sm"
                classNames={{
                  trigger: "bg-gray-100 data-[hover=true]:bg-gray-200",
                }}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
            </div>

            {/* Budget Inputs - Spans 5 columns (grouped visually) */}
            <div className="lg:col-span-5 flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Min Budget"
                  startContent={<span className="text-small text-gray-500">₱</span>}
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  size="lg"
                  radius="sm"
                  classNames={{
                    inputWrapper: "bg-gray-100 data-[hover=true]:bg-gray-200 group-data-[focus=true]:bg-white",
                  }}
                />
              </div>
              <div className="flex items-center text-gray-400">-</div>
              <div className="flex-1">
                <Input
                  placeholder="Max Budget"
                  startContent={<span className="text-small text-gray-500">₱</span>}
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  size="lg"
                  radius="sm"
                  classNames={{
                    inputWrapper: "bg-gray-100 data-[hover=true]:bg-gray-200 group-data-[focus=true]:bg-white",
                  }}
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
              <Spinner size="lg" color="primary" />
              <p className="text-gray-500 mt-4 text-sm">Curating jobs based on your profile...</p>
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
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Budget</span>
                      <span className="font-bold text-blue-900 text-lg">
                        ₱{job.budget_min} - ₱{job.budget_max}
                      </span>
                    </div>
                    <Link href={`/applicant/jobs/details?id=${job.id}`}>
                      <Button color="primary" variant="shadow" size="sm" className="font-medium">
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
                  <Link href="/applicant/profile" className="text-primary font-medium hover:underline">
                    Complete your profile
                  </Link>
                  {" "}to unlock recommendations matching your skills.
                </p>
              </CardBody>
            </Card>
          )}
        </section>

        <Divider className="my-8" />

        {/* All Jobs Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Latest Opportunities</h2>
            <span className="text-sm text-gray-500 hidden sm:block">
              Showing {jobs.length} results
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {jobs.length > 0 ? (
              jobs.map((job) => {
                const alreadyApplied = appliedJobIds.includes(job.id);

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
                        {/* Main Content */}
                        <div className="flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-lg text-gray-900 mb-1">
                                {job.title}
                              </h3>
                              {/* Mobile Price (Hidden on Desktop) */}
                              <span className="sm:hidden font-bold text-blue-900 text-sm">
                                ₱{job.budget_min} - {job.budget_max}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              <Chip size="sm" variant="dot" color="secondary" className="border-none pl-0">
                                {job.category}
                              </Chip>
                              {alreadyApplied && (
                                <Chip size="sm" color="success" variant="flat">Applied</Chip>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2">
                              {job.description}
                            </p>
                          </div>
                        </div>

                        {/* Action Side (Desktop: Right, Mobile: Bottom) */}
                        <div className="border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 flex flex-row sm:flex-col justify-between items-center sm:items-end min-w-[160px]">
                          <div className="hidden sm:flex flex-col items-end text-right">
                            <span className="text-xs text-gray-400">Est. Budget</span>
                            <span className="font-bold text-lg text-blue-900">
                              ₱{Number(job.budget_min).toLocaleString()} - ₱{Number(job.budget_max).toLocaleString()}
                            </span>
                          </div>

                          <div className="w-full sm:w-auto mt-auto">
                            {alreadyApplied ? (
                              <Button
                                fullWidth
                                disabled
                                variant="flat"
                                color="default"
                                size="md"
                                startContent={<span className="text-xl">✓</span>}
                              >
                                Applied
                              </Button>
                            ) : (
                              <Link href={`/applicant/jobs/details?id=${job.id}`} className="w-full block">
                                <Button
                                  fullWidth
                                  color="primary"
                                  variant="ghost"
                                  size="md"
                                  className="font-medium hover:bg-primary hover:text-white"
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
                <h3 className="text-lg font-semibold text-gray-900">No jobs found</h3>
                <p className="text-gray-500 max-w-sm mt-2">
                  We couldn't find any jobs matching your filters. Try adjusting your search terms or budget range.
                </p>
                <Button
                  color="primary"
                  variant="light"
                  className="mt-4"
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
