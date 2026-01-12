import { useEffect, useState } from "react";
import { Button, Link } from "@heroui/react";

import { ScoredJob } from "@/lib/types.ts";
import { supabase } from "@/lib/supabase.ts";

const CircularMatch = ({ value }: { value: number }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 10;
  const size = 56;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color = pct > 80 ? "#3b82f6" : pct > 50 ? "#93c5fd" : "#dbeafe";

  return (
    <svg
      className="block"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
    >
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <circle
          fill="transparent"
          r={radius}
          stroke="#eef2f7"
          strokeLinecap="round"
          strokeWidth={stroke}
        />
        <circle
          fill="transparent"
          r={radius}
          stroke="url(#g)"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={stroke}
          transform="rotate(-90)"
        />
        <text
          fill="#111827"
          fontSize="14"
          fontWeight={700}
          textAnchor="middle"
          x="0"
          y="2"
        >
          {pct}%
        </text>
      </g>
    </svg>
  );
};

const SkillChip = ({
  text,
  variant = "have",
}: {
  text: string;
  variant?: "have" | "missing";
}) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 mb-2
      ${variant === "have" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}
  >
    {variant === "have" ? "✓ " : "• "} {text}
  </span>
);

const JobFeed = ({ userId }: { userId: string }) => {
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase.rpc("get_scored_jobs_for_user", {
        input_user_id: userId,
      });

      if (error) {
        console.error("Error fetching matches:", error);
      } else {
        setJobs((data as ScoredJob[]) || []);
      }
      setLoading(false);
    };

    if (userId) fetchMatches();
  }, [userId]);

  if (loading)
    return <div className="text-sm text-gray-500">Calculating matches...</div>;
  if (!jobs.length)
    return (
      <div className="text-sm text-gray-600">
        No recommended jobs found right now.
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Recommended Jobs for You</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <div
            key={job.job_id}
            aria-labelledby={`job-${job.job_id}-title`}
            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition"
            role="article"
          >
            {/* Card header */}
            <div className="px-5 py-2 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3
                    className="text-lg font-semibold text-slate-900 truncate"
                    id={`job-${job.job_id}-title`}
                  >
                    {job.title}
                  </h3>
                  {/* optional subtitle fields if present on ScoredJob */}
                  <div className="mt-1 text-sm text-slate-500">
                    {"company" in job && (job as any).company
                      ? (job as any).company
                      : null}
                    {"location" in job && (job as any).location
                      ? ` • ${(job as any).location}`
                      : null}
                  </div>
                </div>

                <div className="ml-4 flex-shrink-0">
                  <CircularMatch value={job.match_percentage ?? 0} />
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="px-5 py-2">
              {/* Skills */}
              <div className="mb-3">
                <div className="text-sm text-slate-600 mb-2">
                  <span className="font-medium text-slate-800">Skills</span>
                </div>

                <div className="flex flex-wrap">
                  {job.matching_skills && job.matching_skills.length > 0 ? (
                    job.matching_skills.map((s) => (
                      <SkillChip key={`have-${s}`} text={s} variant="have" />
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">
                      No matching skills
                    </span>
                  )}
                </div>

                {job.missing_skills && job.missing_skills.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-slate-500 mb-1">Missing</div>
                    <div className="flex flex-wrap">
                      {job.missing_skills.map((s) => (
                        <SkillChip
                          key={`miss-${s}`}
                          text={s}
                          variant="missing"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional description/snippet */}
              {("snippet" in job || "description" in job) && (
                <p className="text-sm text-slate-600 line-clamp-3">
                  {(job as any).snippet ?? (job as any).description}
                </p>
              )}
            </div>

            {/* Card footer / actions */}
            <div className="px-5 py-2 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {Math.round(job.match_percentage)}%
                </span>{" "}
                match
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  className="w-full block"
                  href={`/applicant/jobs/details?id=${job.job_id}`}
                >
                  <Button
                    fullWidth
                    className="font-medium hover:bg-primary hover:text-white"
                    color="primary"
                    size="md"
                    variant="ghost"
                  >
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobFeed;
