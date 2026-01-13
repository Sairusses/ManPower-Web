import type { Job } from "@/lib/types";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Chip,
  Link,
  Textarea,
  Divider,
  addToast,
} from "@heroui/react";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  DollarSign,
  FileText,
  ImageIcon,
  File,
  Download,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { getSupabaseClient } from "@/lib/supabase";

export default function ApplicantJobDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");

  const supabase = getSupabaseClient();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Proposal form states
  const [coverLetter, setCoverLetter] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (id) fetchJob(id);
  }, [id]);

  const fetchJob = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) {
        addToast({
          title: "Error fetching job",
          description: error.message,
        });
      }
      setJob(data as Job);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!coverLetter) {
      addToast({
        title: "Missing fields",
        description: "Please fill out all required fields.",
        color: "warning",
      });

      return;
    }
    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        addToast({
          title: "Not logged in",
          description: "You must be logged in to apply.",
          color: "danger",
        });

        return;
      }

      // --- Upload attachments only now ---
      const uploadedFiles: string[] = [];

      for (const file of attachments) {
        const filePath = `proposals_attachments/${user.id}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(filePath, file);

        if (uploadError) {
          addToast({
            title: "Error uploading file",
            description: uploadError.message,
          });
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("uploads").getPublicUrl(filePath);

        uploadedFiles.push(JSON.stringify({ name: file.name, url: publicUrl }));
      }

      const { error } = await supabase.from("proposals").insert({
        job_id: job?.id,
        applicant_id: user.id,
        cover_letter: coverLetter,
        status: "pending",
        attachments: uploadedFiles,
      });

      await supabase.functions.invoke("email-notify", {
        body: {
          type: "new_application",
          payload: {
            to: "rensarno0@gmail.com",
            applicantName: user.user_metadata.display_name,
            jobTitle: job?.title,
            applicantEmail: user.email,
          },
        },
      });

      if (error) {
        addToast({
          title: "Error",
          description: error.message,
          color: "danger",
        });
      }

      addToast({
        title: "Application submitted",
        description: "Your proposal has been sent to the client.",
        color: "success",
      });
      navigate("/applicant/jobs");
    } catch (error: any) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-gray-600">
        Job not found or has been removed.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Top Navigation Bar */}
      <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 h-16 flex items-center">
        <Link href="/applicant/jobs">
          <Button
            className="mb-4"
            color="primary"
            href="/client/jobs"
            startContent={<ArrowLeft className="h-4 w-4" />}
            variant="solid"
          >
            Back to Jobs
          </Button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Job Details (Spans 8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="w-full" radius="md" shadow="sm">
              <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-4 px-6 pt-6 pb-2">
                <div className="space-y-1 w-full">
                  <div className="flex justify-between items-start w-full">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight capitalize">
                      {job?.title || "Loading Job..."}
                    </h1>

                    {/* Mobile Budget (Visible only on small screens) */}
                    {job?.budget_min !== undefined && (
                      <Chip
                        className="sm:hidden font-bold"
                        color="success"
                        size="sm"
                        startContent={<DollarSign size={12} />}
                        variant="flat"
                      >
                        {Number(job.budget_min).toLocaleString()}
                      </Chip>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 pt-2">
                    {job?.category && (
                      <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>{job.category}</span>
                      </div>
                    )}
                    {job?.timeline && (
                      <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{job.timeline}</span>
                      </div>
                    )}
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-md border ${
                        job?.status === "open"
                          ? "border-green-200 text-green-700 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <span className="capitalize font-medium text-xs">
                        {job?.status || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop Budget (Hidden on mobile) */}
                <div className="hidden sm:flex flex-col items-end min-w-fit pl-4">
                  <span className="text-xs text-gray-500 uppercase font-semibold">
                    Budget
                  </span>
                  <span className="text-xl font-bold text-primary flex items-center">
                    ₱{Number(job?.budget_min || 0).toLocaleString()}
                    <span className="mx-1 text-gray-400 text-sm">-</span>₱
                    {Number(job?.budget_max || 0).toLocaleString()}
                  </span>
                </div>
              </CardHeader>

              <Divider className="my-2" />

              <CardBody className="px-6 py-4 space-y-8">
                {/* Description */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    About the Project
                  </h3>
                  <div className="prose prose-sm sm:prose-base text-gray-600 max-w-none whitespace-pre-line">
                    {job?.description}
                  </div>
                </section>

                {/* Skills */}
                {Array.isArray(job?.required_skills) &&
                  job.required_skills.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Required Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.required_skills.map(
                          (skill: string, index: number) => (
                            <Chip
                              key={index}
                              className="bg-gray-100 hover:bg-gray-200 transition-colors"
                              color="default"
                              radius="sm"
                              variant="flat"
                            >
                              {skill}
                            </Chip>
                          ),
                        )}
                      </div>
                    </section>
                  )}

                {/* Attachments */}
                {Array.isArray(job?.files) && job.files.length > 0 && (
                  <section className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" /> Client Attachments
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {job.files.map((file: any, index: number) => {
                        let parsed: any;

                        try {
                          parsed =
                            typeof file === "string" ? JSON.parse(file) : file;
                        } catch {
                          return null;
                        }

                        if (!parsed?.url) return null;

                        return (
                          <a
                            key={index}
                            className="group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                            href={parsed.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <div className="p-2 bg-gray-100 rounded-md group-hover:bg-primary/10 transition-colors">
                              {parsed.type?.startsWith("image/") ? (
                                <ImageIcon className="h-5 w-5 text-gray-600 group-hover:text-primary" />
                              ) : parsed.type?.includes("pdf") ? (
                                <FileText className="h-5 w-5 text-red-500" />
                              ) : (
                                <File className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate group-hover:text-primary">
                                {parsed.name}
                              </p>
                              {parsed.size && (
                                <p className="text-xs text-gray-400">
                                  {Math.round(parsed.size / 1024)} KB
                                </p>
                              )}
                            </div>
                            <Download className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                          </a>
                        );
                      })}
                    </div>
                  </section>
                )}
              </CardBody>
            </Card>
          </div>

          {/* RIGHT COLUMN: Proposal Form (Spans 4 cols on desktop, sticky) */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24">
              <Card className="w-full" radius="md" shadow="md">
                <CardHeader className="pb-0 pt-6 px-6 grid grid-cols-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    Submit Application
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Interested in this job? Send an application.
                  </p>
                </CardHeader>

                <CardBody className="px-6 py-6 gap-5">
                  <Textarea
                    classNames={{
                      label: "font-semibold text-gray-700",
                      inputWrapper: "bg-white",
                    }}
                    label="Cover Letter"
                    labelPlacement="outside"
                    minRows={6}
                    placeholder="Why are you the best fit for this project? Describe your approach..."
                    value={coverLetter}
                    variant="bordered"
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />

                  {/* Custom File Attachment UI */}
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Attachments
                    </span>
                    <div
                      aria-label="Attachments note"
                      className="text-gray-500 bg-gray-100 p-3 rounded-md text-sm leading-relaxed opacity-90"
                      role="note"
                    >
                      <strong>Note:</strong> Attach necessary documents for your
                      job application — resume; barangay clearance; NBI/police
                      clearance; valid ID; diploma/transcript; certificates;
                      other supporting documents.
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <label className="flex flex-col items-center justify-center w-full h-24 cursor-pointer">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Paperclip className="w-6 h-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold text-primary">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                        </div>
                        <input
                          multiple
                          className="hidden"
                          type="file"
                          onChange={(e) => {
                            const files = e.target.files
                              ? Array.from(e.target.files)
                              : [];

                            if (files.length > 0)
                              setAttachments((prev) => [...prev, ...files]);
                          }}
                        />
                      </label>
                    </div>

                    {/* File List */}
                    {attachments.length > 0 && (
                      <ul className="flex flex-col gap-2 mt-3">
                        {attachments.map((file, index) => (
                          <li
                            key={index}
                            className="flex justify-between items-center bg-gray-100 pl-3 pr-2 py-2 rounded-md text-sm border border-gray-200"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="truncate text-gray-700">
                                {file.name}
                              </span>
                            </div>
                            <Button
                              isIconOnly
                              className="min-w-unit-6 w-6 h-6"
                              color="danger"
                              size="sm"
                              variant="light"
                              onPress={() => handleRemoveAttachment(index)}
                            >
                              <X size={14} />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardBody>

                <CardFooter className="px-6 pb-6 pt-0">
                  <Button
                    className="w-full font-semibold shadow-lg shadow-blue-500/20"
                    color="primary"
                    isDisabled={isSubmitting}
                    isLoading={isSubmitting}
                    size="lg"
                    startContent={!isSubmitting && <Send size={18} />}
                    onPress={handleApply}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
