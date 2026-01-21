import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { addToast, Button, Chip, Link } from "@heroui/react";
import { ArrowLeft, Download, ImageIcon, File, FileText } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";

export default function AdminJobsDetails() {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const supabase = getSupabaseClient();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const jobId = searchParams.get("id");

  useEffect(() => {
    if (jobId) fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
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
          color: "danger",
        });
      }
      if (Array.isArray(data.files)) {
        const parsedFiles = data.files
          .map((f: string) => {
            try {
              return JSON.parse(f);
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        setFiles(parsedFiles);
      } else {
        setFiles([]);
      }
      setJob(data);
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "primary";
      case "in_progress":
        return "secondary";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Job not found</h2>
        <Link href="/admin/jobs">
          <Button
            className="mb-4"
            color="primary"
            startContent={<ArrowLeft className="h-4 w-4" />}
            variant="solid"
          >
            Back to Jobs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Link href="/admin/jobs">
          <Button
            className="mb-4"
            color="primary"
            startContent={<ArrowLeft className="h-4 w-4" />}
            variant="solid"
          >
            Back to Jobs
          </Button>
        </Link>

        <Card className="p-4" radius="sm" shadow="sm">
          <CardHeader>
            <div className="flex justify-between w-full items-center">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <Chip color={getStatusColor(job.status)}>{job.status}</Chip>
            </div>
          </CardHeader>

          <CardBody>
            <p className="text-gray-700 mb-4">{job.description}</p>

            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <div>
                <strong>Category:</strong> {job.category}
              </div>
              <div>
                <strong>Timeline:</strong> {job.timeline}
              </div>
              {job.budget_min && job.budget_max && (
                <div>
                  <strong>Salary:</strong> ₱{job.budget_min} - ₱{job.budget_max}
                </div>
              )}
              <div>
                <strong>Posted:</strong>{" "}
                {new Date(job.created_at).toLocaleDateString()}
              </div>
            </div>

            {job.required_skills?.length > 0 && (
              <div className="mt-4">
                <strong>Required Skills:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.required_skills.map((skill: string, i: number) => (
                    <Chip key={i}>{skill}</Chip>
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-700 mb-2">
                  Attachments
                </h4>
                <div className="grid gap-2">
                  {files.map((file: any, i: number) => (
                    <a
                      key={i}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow"
                      href={file.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <div className="flex items-center gap-3">
                        {/* File type icon */}
                        {file.type?.startsWith("image/") ? (
                          <ImageIcon className="h-5 w-5 text-gray-500" />
                        ) : file.type?.includes("pdf") ? (
                          <FileText className="h-5 w-5 text-red-500" />
                        ) : (
                          <File className="h-5 w-5 text-gray-500" />
                        )}

                        <div className="flex flex-col min-w-0">
                          <a
                            className="text-blue-600 hover:underline truncate"
                            href={file.url}
                            rel="noopener noreferrer"
                            target="_blank"
                            title={file.name}
                          >
                            {file.name}
                          </a>
                          {file.size && (
                            <span className="text-xs text-gray-400">
                              {Math.round(file.size / 1024)} KB
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          title="Download"
                          variant="light"
                        >
                          <Download className="h-4 w-4 text-gray-600" />
                        </Button>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
