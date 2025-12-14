import { useEffect, useState } from "react";
import { addToast, Button, Card, Chip, Link } from "@heroui/react";
import { Eye, FileText, Clock, Calendar, Zap } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";
import { Proposal } from "@/lib/types.ts";

export default function ApplicantProposalsList() {
  const supabase = getSupabaseClient();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        addToast({
          title: "Not logged in",
          description: "You must be logged in to view proposals.",
          color: "danger",
        });

        return;
      }

      const { data, error } = await supabase
        .from("proposals")
        .select("*, job:jobs(id, title, description)")
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProposals(data as Proposal[]);
    } catch (err: any) {
      console.error("Error fetching proposals:", err);
      addToast({
        title: "Error",
        description: err.message,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <FileText className="h-7 w-7 text-primary-600" /> My Proposals
          </h1>
          <p className="text-lg text-gray-500 mt-1">
            Review the status and details of all submitted applications.
          </p>
        </div>

        {proposals.length === 0 ? (
          <Card
            className="text-center p-12 bg-white border border-dashed border-gray-300"
            radius="lg"
            shadow="sm"
          >
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700">
              You haven&#39;t submitted any proposals yet.
            </h2>
            <p className="text-gray-500 mt-2">
              Find the perfect opportunity to start working!
            </p>
            <Link href="/applicant/jobs">
              <Button
                className="mt-6 font-semibold"
                color="primary"
                startContent={<Zap className="h-5 w-5" />}
              >
                Browse Available Jobs
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <Card
                key={proposal.id}
                className="p-4 sm:p-6 transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary hover:shadow-lg hover:scale-[1.005] bg-white"
                radius="lg"
                shadow="sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Proposal Info & Status (Left Side) */}
                  <div className="flex-1 min-w-0 pr-4">
                    {/* Job Title and Description */}
                    <h2 className="text-xl font-bold text-gray-900 truncate">
                      {proposal.job?.title || "No Job Title"}
                    </h2>
                    <p className="mt-1 text-gray-600 text-sm line-clamp-2">
                      {proposal.job?.description || "No description provided."}
                    </p>

                    {/* Metadata and Status Row (Stacks below title on mobile) */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-gray-100">
                      {/* Status Chip */}
                      <Chip
                        className="capitalize font-semibold"
                        color={
                          proposal.status === "pending"
                            ? "warning" // Yellow
                            : proposal.status === "accepted"
                              ? "success" // Green
                              : "danger" // Red
                        }
                        size="sm"
                        startContent={<Clock className="h-3.5 w-3.5" />}
                        variant="flat"
                      >
                        {proposal.status}
                      </Chip>

                      {/* Proposed Rate */}
                      {proposal.proposed_rate && (
                        <span className="text-sm text-gray-700 flex items-center gap-1">
                          Rate: ₱{" "}
                          {Number(proposal.proposed_rate).toLocaleString()}
                        </span>
                      )}

                      {/* Estimated Duration */}
                      {proposal.estimated_duration && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Duration: {proposal.estimated_duration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Section (Right Side) */}
                  <div className="flex flex-col items-start sm:items-end flex-shrink-0 gap-2">

                    {/* View Button */}
                    <Link
                      className="w-full sm:w-auto" // Full width button on mobile
                      href={`/applicant/proposals/details?id=${proposal.id}`}
                    >
                      <Button
                        className="w-full sm:w-auto" // Ensures responsiveness
                        color="primary"
                        startContent={<Eye className="h-4 w-4" />}
                        variant="solid"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
