import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, PlayCircle } from "lucide-react";
import api from "../lib/api";
import type { Course } from "../lib/types";


export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.get<Course>(`/api/courses/${slug}`)
      .then(({ data }) => setCourse(data))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="flex justify-center items-center h-64 text-slate-400">Loading...</div>;
  if (!course) return <div className="text-center text-red-400 py-12">Course not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/courses" className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to courses
      </Link>

      <h1 className="text-2xl font-bold text-slate-100">{course.title}</h1>
      {course.description && <p className="text-slate-400 mt-2">{course.description}</p>}

      <div className="mt-8 space-y-3">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Topics</h2>
        {course.topics.map((topic, idx) => (
          <div key={topic.id} className="card hover:border-brand-500/40 transition-all duration-150 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm font-mono shrink-0">{String(idx + 1).padStart(2, "0")}</span>
                <span className="text-slate-100 font-medium">{topic.title}</span>
              </div>
              {topic.description && <p className="text-slate-400 text-sm mt-0.5 ml-7">{topic.description}</p>}
            </div>
            <Link
              to={`/quiz/start?topic=${topic.id}&title=${encodeURIComponent(topic.title)}`}
              className="flex items-center gap-1.5 btn-primary text-sm whitespace-nowrap self-start sm:self-auto"
            >
              <PlayCircle className="w-4 h-4" />
              Start Quiz
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
