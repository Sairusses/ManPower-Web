import { useEffect, useState } from "react";
import { Button, Link } from "@heroui/react";

import { ScoredJob } from "@/lib/types.ts";
import { supabase } from "@/lib/supabase.ts";

const CircularMatch = ({ value }: { value: number }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 8;
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
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
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

  const triggerAiAnalysis = async () => {
    setIsAiProcessing(true);
    try {
      // Call the Supabase Edge Function
      const { error } = await supabase.functions.invoke('ai-job-matcher', {
        body: { user_id: userId }
      });

      if (error) throw error;

      // Once AI is done, re-fetch the SQL data
      await fetchMatches();
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  useEffect(() => {
    if (userId) fetchMatches();
  }, [userId]);

  if (loading && !jobs.length)
    return <div className="text-sm text-gray-500">Loading recommendations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recommended Jobs</h2>
        <Button
          size="sm"
          color="secondary"
          variant="flat"
          isLoading={isAiProcessing}
          onPress={triggerAiAnalysis}
        >
          {isAiProcessing ? "AI is Analyzing..." : "Refresh AI Matches"}
        </Button>
      </div>

      {!jobs.length && !loading ? (
        <div className="text-center py-10 bg-slate-50 rounded-xl">
          <p className="text-gray-600 mb-4">
            We haven't analyzed your profile against open jobs yet.
          </p>
          <Button
            color="primary"
            isLoading={isAiProcessing}
            onPress={triggerAiAnalysis}
          >
            Run AI Matcher
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            /* ... Keep your existing Card JSX exactly the same ... */
            /* The data structure from the new RPC matches the old one */
            <div
              key={job.job_id}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition"
            >
              {/* ... (Existing Card Header/Body Code) ... */}

              <div className="px-5 py-2">
                {/* Match Score */}
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <CircularMatch value={job.match_percentage ?? 0} />
                </div>

                {/* Skills Logic */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {job.matching_skills?.map(s => (
                    <SkillChip key={s} text={s} variant="have" />
                  ))}
                  {job.missing_skills?.map(s => (
                    <SkillChip key={s} text={s} variant="missing" />
                  ))}
                </div>

                <Link href={`/jobs/${job.job_id}`}>
                  <Button fullWidth variant="ghost" color="primary">View Details</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobFeed;
