import { Link } from "react-router-dom";
import { BookOpen, PlayCircle, Trophy } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">
          Welcome back, {user?.name || "developer"} 👋
        </h1>
        <p className="text-slate-400 mt-1">Continue where you left off</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="card text-center">
          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-100">—</p>
          <p className="text-slate-400 text-sm mt-1">Best Score</p>
        </div>
        <div className="card text-center">
          <PlayCircle className="w-8 h-8 text-brand-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-100">—</p>
          <p className="text-slate-400 text-sm mt-1">Quizzes Taken</p>
        </div>
        <div className="card text-center">
          <BookOpen className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-100">—</p>
          <p className="text-slate-400 text-sm mt-1">Topics Completed</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Start Learning</h2>
        <p className="text-slate-400 text-sm mb-4">Pick a course and start a quiz to build your skills.</p>
        <Link to="/courses" className="btn-primary inline-flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Browse Courses
        </Link>
      </div>
    </div>
  );
}
