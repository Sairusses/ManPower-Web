import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Chip,
  Link,
  Skeleton,
} from "@heroui/react";
import { CardHeader } from "@heroui/card";

import { supabase } from "@/lib/supabase";

interface ScoredJob {
  job_id: string;
  title: string;
  match_percentage: number;
  matching_skills: string[];
  missing_skills: string[];
  is_ai_processed: boolean;
}

const CircularMatch = ({ value }: { value: number }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const color = pct > 80 ? "#10b981" : pct > 50 ? "#3b82f6" : "#94a3b8";

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className="text-gray-200"
          cx="28"
          cy="28"
          fill="transparent"
          r="24"
          stroke="currentColor"
          strokeWidth="4"
        />
        <circle
          className="transition-all duration-1000 ease-out"
          cx="28"
          cy="28"
          fill="transparent"
          r="24"
          stroke={color}
          strokeDasharray={150}
          strokeDashoffset={150 - (150 * pct) / 100}
          strokeWidth="4"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-bold text-gray-800">{pct}%</span>
      </div>
    </div>
  );
};

const JobFeed = ({ userId }: { userId: string }) => {
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchMatches = async () => {
    const { data, error } = await supabase.rpc("get_scored_jobs_for_user", {
      input_user_id: userId,
    });

    if (error) console.error(error);
    else setJobs(data || []);
    setLoading(false);
  };

  // 2. Trigger re-calculation (Edge Function)
  const handleUpdateMatches = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase.functions.invoke("ai-job-matcher", {
        body: { user_id: userId },
      });

      if (error) throw error;
      await fetchMatches();
    } catch (err) {
      console.error("Update Error:", err);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (userId) fetchMatches();
  }, [userId]);

  if (loading)
    return (
      <div className="p-4">
        <Skeleton className="rounded-lg w-full h-64" />
      </div>
    );

  const visibleJobs = jobs.filter((j) => (j.match_percentage ?? 0) >= 20);

  return (
    <div className="space-y-6 mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Job Matches</h2>
          <p className="text-sm text-gray-600 mt-1">
            Scores combine profile text analysis (70%) and salary fit (30%).
          </p>
        </div>
        <Button
          className="shadow-md font-semibold"
          color="primary"
          isLoading={updating}
          onPress={handleUpdateMatches}
        >
          {updating ? "Updating matches..." : "Update matches"}
        </Button>
      </div>

      {/* Horizontal scrolling job list */}
      <div className="flex gap-4 overflow-x-auto py-2">
        {visibleJobs.map((job) => (
          <Card
            key={job.job_id}
            className="min-w-[20rem] flex-shrink-0 h-full hover:-translate-y-1 transition-transform duration-300"
          >
            <CardHeader className="flex justify-between items-start pb-2">
              <div className="w-3/4">
                <h3
                  className="font-bold text-lg leading-tight line-clamp-2"
                  title={job.title}
                >
                  {job.title}
                </h3>
              </div>
              <CircularMatch value={job.match_percentage} />
            </CardHeader>

            <Divider className="my-2" />

            <CardBody className="py-2">
              <div className="min-h-[60px]">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Skill Match
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {job.matching_skills.length > 0 ? (
                    job.matching_skills.slice(0, 4).map((s) => (
                      <Chip
                        key={s}
                        className="text-xs h-6"
                        color="success"
                        size="sm"
                        variant="flat"
                      >
                        {s}
                      </Chip>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      No direct skill matches
                    </span>
                  )}
                  {job.matching_skills.length > 4 && (
                    <span className="text-xs text-gray-500 self-center">
                      +{job.matching_skills.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </CardBody>

            <CardFooter>
              <Button
                fullWidth
                as={Link}
                className="font-medium"
                color="primary"
                href={`/applicant/jobs/details?id=${job.job_id}`}
                variant="ghost"
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {!loading && visibleJobs.length === 0 && (
        <div className="text-center py-12 text-gray-600 space-y-4">
          <div>
            We couldn&#39;t find recommended jobs based on your current profile.
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button as={Link} color="primary" href="/applicant/profile">
              Update your profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobFeed;