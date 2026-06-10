import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Clock, Trophy } from "lucide-react";
import api from "../lib/api";
import type { QuizResult } from "../lib/types";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    api.get<QuizResult>(`/api/quiz/results/${sessionId}`)
      .then(({ data }) => setResult(data))
      .catch(() => setError("Could not load results. Please try again."))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div className="flex justify-center items-center h-64 text-slate-400">Loading results...</div>;
  if (error) return <div className="text-center text-red-400 py-12">{error}</div>;
  if (!result) return <div className="text-center text-red-400 py-12">Results not found</div>;

  const passed = result.percentage >= 70;
  const correct = result.items.filter((i) => i.is_correct === true).length;

  return (
    <div className="max-w-xl mx-auto px-6 py-12 text-center">
      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${passed ? "bg-green-500/10" : "bg-red-500/10"}`}>
        <Trophy className={`w-10 h-10 ${passed ? "text-green-400" : "text-red-400"}`} />
      </div>

      <h1 className="text-3xl font-bold text-slate-100 mb-2">{result.percentage}%</h1>
      <p className={`text-lg font-medium mb-1 ${passed ? "text-green-400" : "text-red-400"}`}>
        {passed ? "Great job!" : "Keep practicing!"}
      </p>
      <p className="text-slate-400">
        {correct} of {result.items.length} correct · {result.score}/{result.total_points} points
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-slate-100">{correct}</p>
          <p className="text-slate-400 text-sm mt-1">Correct</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-slate-100">{result.items.length - correct}</p>
          <p className="text-slate-400 text-sm mt-1">Incorrect</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-slate-100">{result.score}/{result.total_points}</p>
          <p className="text-slate-400 text-sm mt-1">Points</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {result.time_taken_seconds != null ? formatTime(result.time_taken_seconds) : "—"}
          </p>
          <p className="text-slate-400 text-sm mt-1">Time Taken</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/courses" className="btn-ghost flex items-center gap-2 justify-center">
          <BookOpen className="w-4 h-4" />
          Back to Courses
        </Link>
        <Link to="/dashboard" className="btn-primary flex items-center gap-2 justify-center">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
