import type { Job, Proposal, Contract } from "@/lib/types";

import { useState, useEffect } from "react";
import {
  addToast,
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Divider,
  Link,
} from "@heroui/react";
import {
  FileText,
  CheckCircle,
  Search,
  Eye,
  Zap,
  Target, // Added for Matched Jobs icon
} from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";

export default function ApplicantDashboard() {
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [matchedJobCount, setMatchedJobCount] = useState(0); // New State
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        addToast({
          title: "Error fetching user",
          description: error.message,
          color: "danger",
        });
      }
      setUser(data.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch recent open jobs
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);

      // 2. Fetch user's proposals
      const { data: proposalsData } = await supabase
        .from("proposals")
        .select(
          `
          *,
          job:jobs(*)
        `,
        )
        .eq("applicant_id", user?.id)
        .order("created_at", { ascending: false });

      // 3. Fetch user's contracts (Still needed for "Completed Jobs" card)
      const { data: contractsData } = await supabase
        .from("contracts")
        .select(`*`)
        .eq("applicant_id", user?.id);

      // 4. Fetch Job Matches (New Logic)
      const { data: matchesData } = await supabase
        .from("job_matches")
        .select("match_score")
        .eq("user_id", user?.id);

      // Calculate matches >= 70
      const validMatches = (matchesData || []).filter(
        (m: any) => parseFloat(m.match_score) >= 70,
      ).length;

      setJobs(jobsData || []);
      setProposals(proposalsData || []);
      setContracts((contractsData as Contract[]) || []);
      setMatchedJobCount(validMatches);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const stats = {
    matchedJobs: matchedJobCount, // Updated from activeContracts
    pendingProposals: proposals.filter((p) => p.status === "pending").length,
    completedContracts: contracts.filter((c) => c.status === "completed")
      .length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header and Greeting */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Welcome back,{" "}
            <span className="text-primary-600">
              {user?.user_metadata?.display_name ?? "Freelancer"}
            </span>
          </h1>
          <p className="text-lg text-gray-500 mt-1">
            Find new opportunities and manage your contracts and proposals.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* CHANGED: Active Contracts -> Matched Jobs */}
          <Card
            className="p-5 bg-white border border-gray-200"
            radius="lg"
            shadow="sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-3">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Matched Jobs
              </div>
              <Target className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardBody className="p-0">
              <div className="text-4xl font-bold text-gray-900">
                {stats.matchedJobs}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommended Jobs For You
              </p>
            </CardBody>
          </Card>

          <Card
            className="p-5 bg-white border border-gray-200"
            radius="lg"
            shadow="sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-3">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Pending Applications
              </div>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardBody className="p-0">
              <div className="text-4xl font-bold text-gray-900">
                {stats.pendingProposals}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting application response
              </p>
            </CardBody>
          </Card>

          <Card
            className="p-5 bg-white border border-gray-200"
            radius="lg"
            shadow="sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-3">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Completed Jobs
              </div>
              <CheckCircle className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardBody className="p-0">
              <div className="text-4xl font-bold text-gray-900">
                {stats.completedContracts}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Successfully finished
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Main Content: Jobs & Proposals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Jobs */}
          <Card className="p-0" radius="lg" shadow="md">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
              <div className="flex flex-col">
                <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" /> Available Jobs
                </div>
                <div className="text-sm text-gray-500">
                  Latest opportunities based on your profile
                </div>
              </div>
              <Link href="/applicant/jobs">
                {" "}
                <Button
                  color="primary"
                  endContent={<Search className="h-4 w-4" />}
                  size="sm"
                >
                  Browse All
                </Button>
              </Link>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-2">
              {jobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="hover:bg-gray-100 transition-colors rounded-sm px-4 py-3"
                >
                  {/* --- JOB ITEM STRUCTURE START --- */}
                  <div className="flex items-start justify-between">
                    {/* Title and Details (Flex-grow to take up space) */}
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-gray-800 truncate hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Chip
                          className="capitalize"
                          color={job.status === "open" ? "success" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          {job.status}
                        </Chip>
                        {job.budget_min && job.budget_max && (
                          <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                            ₱{Number(job.budget_min).toLocaleString()} - ₱
                            {Number(job.budget_max).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {job.required_skills &&
                        job.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.required_skills
                              .slice(0, 3)
                              .map((skill: string, index: number) => (
                                <Chip
                                  key={index}
                                  className="text-xs text-gray-500"
                                  size="sm"
                                  variant="bordered"
                                >
                                  {skill}
                                </Chip>
                              ))}
                            {job.required_skills.length > 3 && (
                              <Chip
                                className="text-xs text-gray-400"
                                size="sm"
                                variant="light"
                              >
                                +{job.required_skills.length - 3} more
                              </Chip>
                            )}
                          </div>
                        )}
                    </div>
                    <div className="self-center mt-0">
                      <Link href={`/applicant/jobs/details?id=${job.id}`}>
                        <Button color="primary" size="sm" variant="flat">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {jobs.length === 0 && (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <Search className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium text-gray-700">
                    No available jobs found
                  </p>
                  <p className="text-sm">
                    Check your profile skills or browse all jobs directly.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* My Proposals */}
          <Card className="p-0" radius="lg" shadow="md">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
              <div className="flex flex-col">
                <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> My Proposals
                </div>
                <div className="text-sm text-gray-500">
                  Track your submitted applications
                </div>
              </div>
              <Link href="/applicant/proposals">
                {" "}
                <Button
                  color="primary"
                  endContent={<Eye className="h-4 w-4" />}
                  size="sm"
                >
                  View All
                </Button>
              </Link>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-2">
              {proposals.slice(0, 5).map((proposal) => (
                <div
                  key={proposal.id}
                  className="hover:bg-gray-100 transition-colors rounded-sm px-4 py-3"
                >
                  {/* --- PROPOSAL ITEM STRUCTURE START --- */}
                  <div className="flex items-start justify-between">
                    {/* Title and Details (Flex-grow to take up space) */}
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {proposal.job?.title}
                      </h3>
                      <span className="text-sm font-medium text-gray-400">
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {/* Proposal Status Chip */}
                        <Chip
                          className="capitalize font-semibold"
                          color={
                            proposal.status === "pending"
                              ? "warning"
                              : proposal.status === "accepted"
                                ? "success"
                                : "danger"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {proposal.status}
                        </Chip>
                      </div>
                    </div>
                    <div className="self-center mt-0">
                      <Link
                        href={`/applicant/proposals/details?id=${proposal.id}`}
                      >
                        <Button color="primary" size="sm" variant="flat">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                  {/* --- PROPOSAL ITEM STRUCTURE END --- */}
                </div>
              ))}

              {proposals.length === 0 && (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium text-gray-700">
                    You haven&#39;t submitted any proposals yet
                  </p>
                  <Link href="/applicant/jobs">
                    <Button
                      className="mt-4 font-semibold"
                      color="primary"
                      variant="shadow"
                    >
                      Browse Jobs
                    </Button>
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
