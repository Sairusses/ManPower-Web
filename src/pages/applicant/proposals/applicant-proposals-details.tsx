import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  addToast,
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Avatar,
  Link,
  Divider,
} from "@heroui/react";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Mail,
  Phone,
  Globe,
  File,
  Loader,
} from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";

export default function ApplicantProposalsDetails() {
  const supabase = getSupabaseClient();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const proposalId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<any>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    if (proposalId) fetchProposalDetails();
  }, [proposalId]);

  const fetchProposalDetails = async () => {
    try {
      // fetch proposal
      const { data: proposalData, error: proposalError } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", proposalId)
        .single();

      if (proposalError) {
        addToast({
          title: "Error",
          description: proposalError.message,
          color: "danger",
        });

        return;
      }

      setProposal(proposalData);

      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", proposalData.job_id)
        .single();

      setJob(jobData);

      if (jobData) {
        const { data: adminData } = await supabase
          .from("users")
          .select("*")
          .eq("role", "admin")
          .single();

        setAdmin(adminData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <Link href="/applicant/proposals">
            <Button
              className="font-medium text-medium py-5 pr-6"
              color="primary"
              size="sm"
              startContent={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
          </Link>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
            Proposal Details
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="animate-spin h-10 w-10 text-primary" />
          </div>
        ) : !proposal ? (
          <div className="text-center py-20 text-gray-600">
            Proposal not found or invalid ID.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* LEFT COLUMN: Admin Info (Stays sticky/fixed on scroll on desktop) */}
            <div className="lg:sticky lg:top-8 lg:col-span-1 space-y-8">
              <Card className="p-6 bg-white" radius="lg" shadow="md">
                <CardBody className="p-0">
                  {admin ? (
                    <div className="space-y-4">
                      {/* Admin Profile */}
                      <div className="flex items-center gap-4 pb-4 mb-4">
                        <Avatar
                          className="flex-shrink-0"
                          name={admin.full_name}
                          size="lg"
                          src={admin.avatar_url}
                        />
                        <div>
                          <div className="font-extrabold text-lg text-gray-900">
                            {admin.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {admin.company_name || "Platform Client"}
                          </div>
                        </div>
                      </div>
                      <Divider />
                      {/* Admin Contact Details */}
                      <div className="space-y-3 text-sm text-gray-700">
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">Email:</span>{" "}
                          {admin.email}
                        </p>
                        {admin.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold">Phone:</span>{" "}
                            {admin.phone}
                          </p>
                        )}
                        {admin.location && (
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold">
                              Location:
                            </span>{" "}
                            {admin.location}
                          </p>
                        )}
                        {admin.website && (
                          <p className="flex items-center gap-2 truncate">
                            <Globe className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="font-semibold flex-shrink-0">
                              Website:
                            </span>{" "}
                            <Link
                              className="text-primary hover:underline truncate"
                              href={admin.website}
                              target="_blank"
                            >
                              {admin.website}
                            </Link>
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 py-4">
                      No client information available.
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
              {job && (
                <Card className="p-6" radius="lg" shadow="md">
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {job.title}
                      </h2>
                    </div>
                  </CardHeader>
                  <CardBody className="p-0">
                    <p className="text-gray-600 mb-4 whitespace-pre-line">
                      {job.description}
                    </p>

                    {/* Job Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-700 font-medium mb-4">
                      {job.budget_min && job.budget_max && (
                        <div className="flex items-center gap-1">
                          Budget: ₱{Number(job.budget_min).toLocaleString()} - ₱
                          {Number(job.budget_max).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {job.required_skills?.length > 0 && (
                      <div className="pt-4">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Required Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {job.required_skills.map(
                            (skill: string, idx: number) => (
                              <Chip
                                key={idx}
                                className="bg-white"
                                size="sm"
                                variant="bordered"
                              >
                                {skill}
                              </Chip>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}

              {/* 2. Proposal Submission Card */}
              <Card className="p-6" radius="lg" shadow="md">
                <CardHeader className="p-0 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Submission
                  </h2>
                </CardHeader>
                <CardBody className="p-0 space-y-6">
                  {/* Proposal Status & Rate */}
                  <div className="grid grid-cols-3 gap-4 pb-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 uppercase font-semibold">
                        Status
                      </span>
                      <Chip
                        className="capitalize text-white font-bold mt-1"
                        color={
                          proposal.status === "pending"
                            ? "warning"
                            : proposal.status === "accepted"
                              ? "success"
                              : "danger"
                        }
                        radius="sm"
                        size="md"
                      >
                        {proposal.status}
                      </Chip>
                    </div>
                    {proposal.proposed_rate && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-semibold">
                          Proposed Rate
                        </span>
                        <span className="text-lg font-bold text-gray-800 mt-1">
                          ₱{Number(proposal.proposed_rate).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {proposal.estimated_duration && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-semibold">
                          Estimated Duration
                        </span>
                        <span className="text-lg font-bold text-gray-800 mt-1 flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-600" />
                          {proposal.estimated_duration}
                        </span>
                      </div>
                    )}
                  </div>
                  <Divider />

                  {/* Cover Letter */}
                  <div>
                    <h4 className="text-sm text-gray-500 uppercase font-semibold tracking-wider mb-2">
                      Cover Letter
                    </h4>
                    <p className="text-gray-700 leading-relaxed p-4">
                      {proposal.cover_letter}
                    </p>
                  </div>

                  {/* Attachments */}
                  {proposal.attachments?.length > 0 && (
                    <div>
                      <h4 className="text-sm text-gray-500 uppercase font-semibold tracking-wider mb-3">
                        Your Attachments
                      </h4>
                      <ul className="space-y-2">
                        {proposal.attachments.map(
                          (fileStr: string, idx: number) => {
                            let file: {
                              name: string;
                              url: string;
                              size?: number;
                            };

                            try {
                              file = JSON.parse(fileStr);
                            } catch {
                              return null;
                            }

                            return (
                              <li key={idx}>
                                <Link
                                  className="no-underline block"
                                  href={file.url}
                                  target="_blank"
                                >
                                  <Button
                                    className="w-full justify-between px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                    color="default"
                                    variant="ghost"
                                  >
                                    <span className="flex items-center gap-2 truncate text-sm font-medium text-gray-700">
                                      <File className="h-4 w-4 text-primary flex-shrink-0" />
                                      <span className="truncate">
                                        {file.name}
                                      </span>
                                    </span>
                                    {file.size && (
                                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                        ({Math.round(file.size / 1024)} KB)
                                      </span>
                                    )}
                                  </Button>
                                </Link>
                              </li>
                            );
                          },
                        )}
                      </ul>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
