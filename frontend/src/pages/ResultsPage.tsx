import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, CheckCircle, ChevronDown, ChevronUp, Clock, RotateCcw, Trophy, XCircle } from "lucide-react";
import api from "../lib/api";
import type { QuizResult, QuizResultItem } from "../lib/types";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-500/10 text-green-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  hard: "bg-red-500/10 text-red-400",
};

const TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple Choice",
  predict_output: "Predict Output",
  fill_blank: "Fill in Blank",
  debugging: "Debugging",
  code_writing: "Code Writing",
};

function ScoreRing({ percentage, passed }: { percentage: number; passed: boolean }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-44 h-44 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} className="stroke-surface-700" strokeWidth="10" fill="none" />
        <circle
          cx="64" cy="64" r={radius}
          stroke={passed ? "#22c55e" : "#ef4444"}
          strokeWidth="10" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${passed ? "text-green-400" : "text-red-400"}`}>
          {percentage}%
        </span>
        <span className="text-slate-400 text-xs mt-0.5">{passed ? "Passed" : "Failed"}</span>
      </div>
    </div>
  );
}

function QuestionReviewCard({ item, index }: { item: QuizResultItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const correct = item.is_correct === true;

  return (
    <div className={`card border-l-4 ${correct ? "border-l-green-500/60" : "border-l-red-500/60"}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {correct
            ? <CheckCircle className="w-5 h-5 text-green-400" />
            : <XCircle className="w-5 h-5 text-red-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-slate-500 font-mono text-xs">Q{index + 1}</span>
            {item.difficulty && (
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${DIFFICULTY_COLORS[item.difficulty] || ""}`}>
                {item.difficulty}
              </span>
            )}
            {item.question_type && (
              <span className="text-xs text-slate-500 bg-surface-700 px-2 py-0.5 rounded-md">
                {TYPE_LABELS[item.question_type] || item.question_type}
              </span>
            )}
            <span className="text-xs text-slate-600 ml-auto">{item.points} pts</span>
          </div>

          <p className="text-slate-200 text-sm leading-relaxed mb-3">{item.question_text}</p>

          {!correct && (
            <div className="space-y-1.5 mb-3">
              <div className="flex items-start gap-2">
                <span className="text-xs text-red-400 font-medium shrink-0 mt-0.5">Your answer:</span>
                <span className="text-xs text-red-300 font-mono">{item.user_answer || "—"}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-green-400 font-medium shrink-0 mt-0.5">Correct:</span>
                <span className="text-xs text-green-300 font-mono">{item.correct_answer}</span>
              </div>
            </div>
          )}

          {item.explanation && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Hide explanation" : "Show explanation"}
            </button>
          )}
          {expanded && item.explanation && (
            <p className="mt-2 text-slate-400 text-xs leading-relaxed border-t border-surface-600 pt-2">
              {item.explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
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
  const correct = result.items.filter(i => i.is_correct === true).length;
  const incorrect = result.items.length - correct;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {/* Score hero */}
      <div className="text-center mb-8">
        <ScoreRing percentage={result.percentage} passed={passed} />
        <div className="flex items-center justify-center gap-2 mt-4 mb-1">
          <Trophy className={`w-5 h-5 ${passed ? "text-green-400" : "text-red-400"}`} />
          <h1 className={`text-xl font-bold ${passed ? "text-green-400" : "text-red-400"}`}>
            {passed ? "Great job!" : "Keep practicing!"}
          </h1>
        </div>
        <p className="text-slate-400 text-sm">
          {correct} of {result.items.length} correct · {result.score}/{result.total_points} points
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-400">{correct}</p>
          <p className="text-slate-400 text-xs mt-1">Correct</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-400">{incorrect}</p>
          <p className="text-slate-400 text-xs mt-1">Incorrect</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-slate-100">{result.score}<span className="text-base text-slate-500">/{result.total_points}</span></p>
          <p className="text-slate-400 text-xs mt-1">Points</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {result.time_taken_seconds != null ? formatTime(result.time_taken_seconds) : "—"}
          </p>
          <p className="text-slate-400 text-xs mt-1">Time</p>
        </div>
      </div>

      {/* Per-question review */}
      {result.items.some(i => i.question_text) && (
        <div className="mb-8">
          <h2 className="text-slate-300 font-semibold mb-3 text-sm uppercase tracking-wide">Question Review</h2>
          <div className="space-y-3">
            {result.items.map((item, idx) => (
              <QuestionReviewCard key={item.question_id} item={item} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => window.history.back()} className="btn-ghost flex items-center gap-2 justify-center">
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
        <Link to="/courses" className="btn-ghost flex items-center gap-2 justify-center">
          <BookOpen className="w-4 h-4" /> Back to Courses
        </Link>
        <Link to="/dashboard" className="btn-primary flex items-center gap-2 justify-center">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
