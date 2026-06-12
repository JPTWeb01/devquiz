import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, FileQuestion, Loader2, Trash2 } from "lucide-react";
import api from "../../lib/api";
import type { AdminQuestionAll } from "../../lib/types";
import AdminLayout from "../../components/layout/AdminLayout";

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

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {message}
    </div>
  );
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function AdminAllQuestionsPage() {
  const { status } = useParams<{ status: string }>();
  const navigate = useNavigate();
  const isPublished = status === "published";

  const [questions, setQuestions] = useState<AdminQuestionAll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const load = () => {
    setLoading(true);
    api
      .get<AdminQuestionAll[]>(`/api/questions/admin/all?status=${status}`)
      .then(({ data }) => setQuestions(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status !== "published" && status !== "unpublished") {
      navigate("/admin/questions/published", { replace: true });
      return;
    }
    setFilterCourse("all");
    setFilterType("all");
    load();
  }, [status]);

  const handleToggle = async (q: AdminQuestionAll) => {
    setTogglingId(q.id);
    try {
      await api.patch(`/api/questions/${q.id}/publish`);
      load();
      showToast(q.is_published ? "Moved to Unpublished" : "Question published");
    } catch {
      showToast("Failed to update", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (q: AdminQuestionAll) => {
    if (!confirm("Delete this question permanently?")) return;
    try {
      await api.delete(`/api/questions/${q.id}`);
      load();
      showToast("Question deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const courses = ["all", ...Array.from(new Set(questions.map(q => q.course_title))).sort()];
  const types = ["all", ...Array.from(new Set(questions.map(q => q.type))).sort()];

  const filtered = questions.filter(q => {
    if (filterCourse !== "all" && q.course_title !== filterCourse) return false;
    if (filterType !== "all" && q.type !== filterType) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        {toast && <Toast {...toast} />}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">
            {isPublished ? "Published Questions" : "Unpublished Questions"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {loading ? "Loading…" : `${questions.length} question${questions.length !== 1 ? "s" : ""} total`}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-surface-700 p-1 rounded-lg mb-6 w-fit">
          <Link
            to="/admin/questions/published"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isPublished
                ? "bg-surface-800 text-slate-100 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Published
          </Link>
          <Link
            to="/admin/questions/unpublished"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !isPublished
                ? "bg-surface-800 text-slate-100 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" /> Unpublished
          </Link>
        </div>

        {/* Filters */}
        {!loading && questions.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">Course</label>
              <select
                value={filterCourse}
                onChange={e => setFilterCourse(e.target.value)}
                className="bg-surface-700 border border-surface-600 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">All Courses</option>
                {courses.filter(c => c !== "all").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">Type</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-surface-700 border border-surface-600 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">All Types</option>
                {types.filter(t => t !== "all").map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                ))}
              </select>
            </div>
            {(filterCourse !== "all" || filterType !== "all") && (
              <button
                onClick={() => { setFilterCourse("all"); setFilterType("all"); }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear filters
              </button>
            )}
            {(filterCourse !== "all" || filterType !== "all") && (
              <span className="text-xs text-slate-500">{filtered.length} of {questions.length} shown</span>
            )}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card h-24 animate-pulse bg-surface-700" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="card text-center py-16">
            <FileQuestion className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">
              No {isPublished ? "published" : "unpublished"} questions
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {isPublished
                ? "Publish questions from the topic management pages."
                : "All questions are published — great work!"}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No questions match your filters.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((q, idx) => (
              <div
                key={q.id}
                className={`card border-l-4 ${
                  q.is_published ? "border-l-green-500/60" : "border-l-slate-600"
                } hover:border-slate-600 transition-colors`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  {/* Left: question info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-slate-600 font-mono text-sm mt-0.5 w-6 shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
                          {q.difficulty}
                        </span>
                        <span className="text-xs text-slate-500 bg-surface-700 px-2 py-0.5 rounded-md">
                          {TYPE_LABELS[q.type] || q.type}
                        </span>
                        <span className="text-xs text-slate-600">{q.points}pts</span>
                      </div>

                      {/* Question text */}
                      <p className="text-slate-200 text-sm leading-relaxed line-clamp-2">
                        {q.question_text}
                      </p>

                      {/* Meta: topic / course / date */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        <span className="text-slate-500 text-xs">
                          {q.course_title} › {q.topic_title}
                        </span>
                        <span className="text-slate-600 text-xs">·</span>
                        <span className="text-slate-500 text-xs">
                          {isPublished
                            ? `Published ${fmtDate(q.published_at)}`
                            : `Created ${fmtDate(q.created_at)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      onClick={() => handleToggle(q)}
                      disabled={togglingId === q.id}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                        q.is_published
                          ? "text-green-400 border-green-500/30 bg-green-500/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                          : "text-slate-400 border-surface-600 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30"
                      }`}
                    >
                      {togglingId === q.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : q.is_published ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                      {q.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => handleDelete(q)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
