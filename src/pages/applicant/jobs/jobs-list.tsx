import type { Job } from "@/lib/types";

import { useState, useEffect } from "react";
import {Eye, Search} from "lucide-react";
import {
  addToast,
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Link,
  Spinner,
} from "@heroui/react";
import { Card, CardBody, CardHeader } from "@heroui/card";

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Browse Jobs</h1>

        {/* Filters */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Input
            className="w-full md:w-64"
            placeholder="Search jobs..."
            startContent={<Search className="w-4 h-4 text-gray-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Input
            className="w-32"
            placeholder="Min"
            startContent={
              <span className="text-small text-default-400">$</span>
            }
            type="number"
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
          />
          <Input
            className="w-32"
            placeholder="Max"
            startContent={
              <span className="text-small text-default-400">$</span>
            }
            type="number"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />
          <Select
            className="w-full md:w-64"
            items={categories}
            placeholder="Category"
            selectedKeys={categoryFilter ? [categoryFilter] : []}
            onSelectionChange={(keys) =>
              setCategoryFilter(Array.from(keys)[0] as string)
            }
          >
            {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
          </Select>
          {/* Clear Filters Button could go here */}
        </div>

        {/* Recommended Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Recommended for You</h2>
          </div>

          {loadingRecommended ? (
            <div className="py-12 flex justify-center w-full">
              <Spinner
                color="primary"
                label="Finding matches based on your skills..."
              />
            </div>
          ) : recommendedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedJobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-md transition-shadow p-2"
                >
                  <CardHeader className="flex justify-between items-start pb-2">
                    <div className="pr-4">
                      <h3 className="font-bold text-lg line-clamp-1">
                        {job.title}
                      </h3>
                      <p className="text-xs text-gray-500 capitalize">
                        {job.category}
                      </p>
                    </div>
                    <Chip
                      className="min-w-fit"
                      color="default"
                      radius="sm"
                      size="sm"
                      variant="flat"
                    >
                      Skill Match
                    </Chip>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {job.description}
                    </p>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="font-semibold">
                        &#8369;{job.budget_min} - &#8369;{job.budget_max}
                      </span>
                      <Link href={`/applicant/jobs/details?id=${job.id}`}>
                        <Button color="primary" size="sm">
                          View Job
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 text-sm">
              <Link
                className="font-medium text-primary underline"
                href="/applicant/profile"
              >
                Update your profile
              </Link>{" "}
              or start searching for jobs to get personalised job
              recommendations here.
            </div>
          )}
        </div>

        {/* All Jobs Section */}
        <h2 className="text-2xl font-bold mb-4">All Jobs</h2>
        <div className="grid grid-cols-1 gap-4">
          {jobs.length > 0 ? (
            jobs.map((job) => {
              const alreadyApplied = appliedJobIds.includes(job.id);
              return (
                <Card
                  key={job.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardBody className="flex flex-col md:flex-row gap-4 p-4">
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{job.title}</h3>
                          <Chip
                            className="min-w-fit"
                            color="default"
                            radius="sm"
                            size="sm"
                            variant="flat"
                          >
                            {job.category}
                          </Chip>
                        </div>
                        <div className="md:hidden font-semibold">
                          &#8369;{job.budget_min} - &#8369;{job.budget_max}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex md:flex-col justify-between items-end gap-2 md:min-w-[140px] border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0">
                      <div className="hidden md:block font-bold text-lg">
                        &#8369;{job.budget_min} - &#8369;{job.budget_max}
                      </div>
                      <div className="flex justify-end">
                        {alreadyApplied ? (
                          <Button disabled color="default" size="sm">
                            Already Applied
                          </Button>
                        ) : (
                          <Link href={`/applicant/jobs/details?id=${job.id}`}>
                            <Button color="primary" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View & Apply
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-500">
              No jobs found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
