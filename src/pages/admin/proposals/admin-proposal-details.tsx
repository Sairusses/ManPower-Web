import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Avatar, Button, Chip, Link, addToast } from "@heroui/react";
import { File, MapPin, MessageSquare, Phone } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";
import { Proposal } from "@/lib/types";

export default function AdminProposalDetails() {
  const supabase = getSupabaseClient();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const proposalId = searchParams.get("id");

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (proposalId) {
      fetchProposalDetails(proposalId);
    }
  }, [proposalId]);

  const fetchProposalDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select(
          `
          id,
          cover_letter,
          proposed_rate,
          estimated_duration,
          status,
          attachments,
          created_at,
          job:jobs(id, title, description),
          applicant:users(id, full_name, avatar_url, email, phone, location, bio, skills, hourly_rate, resume_url)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      if (Array.isArray(data.attachments)) {
        const parsedFiles = data.attachments
          .map((f: string) => {
            try {
              return JSON.parse(f);
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        setAttachments(parsedFiles);
      } else {
        setAttachments([]);
      }

      setProposal(data as unknown as Proposal);
    } catch (err: any) {
      console.error("Error fetching proposal:", err);
      addToast({
        title: "Error",
        description: err.message,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision: "accepted" | "rejected") => {
    if (!proposal) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userID = session!.user.id;

    try {
      setSubmitting(true);

      // update proposal status
      const { error: updateError } = await supabase
        .from("proposals")
        .update({ status: decision })
        .eq("id", proposal.id);

      if (updateError) throw updateError;

      if (decision === "accepted") {
        // create contract
        const { data: contractData, error: contractError } = await supabase
          .from("contracts")
          .insert([
            {
              job_id: proposal.job?.id,
              proposal_id: proposal.id,
              applicant_id: proposal.applicant?.id,
              agreed_rate: proposal.proposed_rate,
              start_date: new Date().toISOString(),
              status: "active",
            },
          ])
          .select()
          .single();

        if (contractError) throw contractError;

        const messageContent = `I accepted your proposal for "${proposal.job?.title}"`;
        const { error: messageError } = await supabase.from("messages").insert([
          {
            contract_id: contractData.id,
            proposal_id: proposal.id,
            sender_id: userID,
            receiver_id: proposal.applicant?.id,
            content: messageContent,
            created_at: new Date().toISOString(),
          },
        ]);

        if (messageError) throw messageError;

        // Invoke email-notify function
        await supabase.functions.invoke("email-notify", {
          body: {
            type: "proposal_accepted",
            payload: {
              to: proposal.applicant?.email,
              applicantName: proposal.applicant?.full_name,
              jobTitle: proposal.job?.title,
              jobDescription: proposal.job?.description,
              proposedRate: proposal.proposed_rate,
              estimatedDuration: proposal.estimated_duration,
              coverLetter: proposal.cover_letter,
            },
          },
        });

        window.location.href = `/admin/messages?contractId=${contractData.id}`;
      } else {
        window.location.href = "/admin/proposals";
      }

      addToast({
        title: "Success",
        description: `Proposal ${decision}`,
        color: decision === "accepted" ? "success" : "danger",
      });
    } catch (err: any) {
      console.error("Error updating proposal:", err);
      addToast({
        title: "Error",
        description: err.message,
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600">Proposal not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-sm">
          <CardHeader className="flex items-center gap-3">
            <Avatar
              alt={proposal.applicant?.full_name}
              size="lg"
              src={proposal.applicant?.avatar_url || ""}
            />
            <div>
              <h2 className="font-semibold text-lg">
                {proposal.applicant?.full_name}
              </h2>
              <p className="text-sm text-gray-500">
                {proposal.applicant?.email}
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              {proposal.applicant?.location || "No location provided"}
            </p>
            <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              {proposal.applicant?.phone || "No phone provided"}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {proposal.applicant?.bio || "No bio provided"}
            </p>

            {proposal.applicant?.skills && (
              <div className="flex flex-wrap gap-1 mb-4">
                {proposal.applicant.skills.map((skill: string, idx: number) => (
                  <Chip
                    key={idx}
                    className="p-2"
                    color="primary"
                    size="sm"
                    variant="flat"
                  >
                    {skill}
                  </Chip>
                ))}
              </div>
            )}

            {proposal.applicant?.resume_url && (
              <Link href={proposal.applicant.resume_url} target="_blank">
                <Button
                  size="sm"
                  startContent={<File className="h-4 w-4" />}
                  variant="flat"
                >
                  View Resume
                </Button>
              </Link>
            )}

            {proposal && (
              <div className="pt-4">
                <Button
                  color="primary"
                  startContent={<MessageSquare className="h-4 w-4" />}
                  onPress={() =>
                    (window.location.href = `/messages?proposalId=${proposal.id}&applicantId=${proposal.applicant?.id}`)
                  }
                >
                  Message Applicant
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <h2 className="text-xl font-semibold">
              Proposal for: {proposal.job?.title}
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Cover Letter</p>
              <p className="text-gray-800 whitespace-pre-line">
                {proposal.cover_letter}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Estimated Duration</p>
                <p className="font-bold text-blue-600">
                  {proposal.estimated_duration}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Proposed Rate</p>
                <p className="font-bold text-blue-600">
                  ₱{proposal.proposed_rate}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Chip
                color={
                  proposal.status === "pending"
                    ? "default"
                    : proposal.status === "accepted"
                      ? "success"
                      : "danger"
                }
              >
                {proposal.status}
              </Chip>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Attachments:</p>
                <div className="flex flex-wrap gap-2">
                  {attachments.map(
                    (file: { name: string; url: string }, i: number) => (
                      <Link
                        key={i}
                        className="w-fit"
                        href={file.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Button
                          size="sm"
                          startContent={<File className="h-4 w-4" />}
                          variant="flat"
                        >
                          {file.name}
                        </Button>
                      </Link>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Accept / Reject buttons */}
            {proposal.status === "pending" && (
              <div className="flex gap-3 pt-4">
                <Button
                  color="primary"
                  isDisabled={submitting}
                  onPress={() => handleDecision("accepted")}
                >
                  Accept Proposal
                </Button>
                <Button
                  color="danger"
                  isDisabled={submitting}
                  variant="flat"
                  onPress={() => handleDecision("rejected")}
                >
                  Reject Proposal
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
