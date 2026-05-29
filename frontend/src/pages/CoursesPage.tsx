import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Layers } from "lucide-react";
import api from "../lib/api";
import type { CourseListItem } from "../lib/types";

const LANGUAGE_COLORS: Record<string, string> = {
  js: "text-yellow-400 bg-yellow-400/10",
  python: "text-blue-400 bg-blue-400/10",
  react: "text-cyan-400 bg-cyan-400/10",
  nextjs: "text-slate-300 bg-slate-300/10",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<CourseListItem[]>("/api/courses")
      .then(({ data }) => setCourses(data))
      .catch(() => setError("Failed to load courses"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64 text-slate-400">Loading courses...</div>;
  if (error) return <div className="text-center text-red-400 py-12">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Courses</h1>
        <p className="text-slate-400 mt-1">Choose a language and start practicing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/courses/${course.slug}`}
            className="card hover:border-brand-500/50 hover:bg-surface-700/50 transition-all duration-150 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${LANGUAGE_COLORS[course.language] || "text-slate-400 bg-surface-700"}`}>
                  {course.language}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors" />
            </div>

            <h2 className="text-lg font-semibold text-slate-100 mt-3">{course.title}</h2>
            {course.description && (
              <p className="text-slate-400 text-sm mt-1 line-clamp-2">{course.description}</p>
            )}

            <div className="flex items-center gap-1 mt-4 text-slate-500 text-sm">
              <Layers className="w-4 h-4" />
              {course.topic_count} {course.topic_count === 1 ? "topic" : "topics"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
