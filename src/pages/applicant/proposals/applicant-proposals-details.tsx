import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip, addToast, Avatar, Link, Button } from "@heroui/react";
import { ArrowLeft, File } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row gap-6 justify-items-center">
          <Link href="/applicant/proposals">
            <Button
              className="mb-4"
              color="primary"
              startContent={<ArrowLeft className="h-4 w-4" />}
              variant="solid"
            >
              Back to Proposals
            </Button>
          </Link>
          <div className="font-bold text-2xl"> Proposal Details </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : !proposal ? (
          <div className="text-center py-12 text-gray-600">
            Proposal not found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Admin Info  */}
            <Card className="md:col-span-1 px-4 py-2" shadow="sm">
              <CardHeader>
                <h2 className="text-lg font-bold">Admin Information</h2>
              </CardHeader>
              <CardBody>
                {admin ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={admin.full_name} src={admin.avatar_url} />
                      <div>
                        <div className="font-semibold">{admin.full_name}</div>
                        <div className="text-sm text-gray-500">
                          {admin.company_name || "Platform Admin"}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <strong>Email:</strong> {admin.email}
                    </div>
                    {admin.phone && (
                      <div className="text-sm text-gray-700">
                        {/* UPDATED: client -> admin */}
                        <strong>Phone:</strong> {admin.phone}
                      </div>
                    )}
                    {admin.location && (
                      <div className="text-sm text-gray-700">
                        <strong>Location:</strong> {admin.location}
                      </div>
                    )}
                    {admin.website && (
                      <div className="text-sm text-gray-700">
                        <strong>Website:</strong>{" "}
                        <Link href={admin.website} target="_blank">
                          {admin.website}
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">No admin info found</div>
                )}
              </CardBody>
            </Card>

            {/* Right: Proposal + Job */}
            <Card className="md:col-span-2 px-4 py-2" shadow="sm">
              <CardBody>
                {job && (
                  <div className="mb-6">
                    <div className="text-xl font-semibold">{job.title}</div>
                    <div className="text-gray-600 mb-2">{job.description}</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {job.required_skills?.map(
                        (skill: string, idx: number) => (
                          <Chip key={idx}>{skill}</Chip>
                        ),
                      )}
                    </div>
                    {job.budget_min && job.budget_max && (
                      <div className="text-sm text-gray-700 font-medium">
                        Budget: ₱{job.budget_min} - ₱{job.budget_max}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <strong>Status:</strong> {proposal.status}
                  </div>
                  <div>
                    <strong>Cover Letter:</strong>
                    <p className="text-gray-700 whitespace-pre-line mt-1">
                      {proposal.cover_letter}
                    </p>
                  </div>
                  {proposal.estimated_duration && (
                    <div>
                      <strong>Estimated Duration:</strong>{" "}
                      {proposal.estimated_duration}
                    </div>
                  )}
                  {proposal.attachments?.length > 0 && (
                    <div>
                      <strong>Attachments:</strong>
                      <ul className="mt-2 space-y-2">
                        {proposal.attachments.map(
                          (fileStr: string, idx: number) => {
                            // Note: Assuming fileStr is still JSON stringified object
                            const file = JSON.parse(fileStr);

                            return (
                              <li key={idx}>
                                <Link
                                  className="no-underline"
                                  href={file.url}
                                  target="_blank"
                                >
                                  <Button
                                    className="min-w-xs justify-start border border-dashed"
                                    color="primary"
                                    startContent={<File className="h-4 w-4" />}
                                    variant="flat"
                                  >
                                    {file.name}
                                  </Button>
                                </Link>
                              </li>
                            );
                          },
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}