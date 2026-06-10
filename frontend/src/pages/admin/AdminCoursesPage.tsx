import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Layers, Plus, Trash2, X } from "lucide-react";
import api from "../../lib/api";
import type { CourseListItem } from "../../lib/types";
import AdminLayout from "../../components/layout/AdminLayout";

const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript", color: "text-yellow-400 bg-yellow-400/10" },
  { value: "python", label: "Python", color: "text-blue-400 bg-blue-400/10" },
  { value: "html", label: "HTML & CSS", color: "text-orange-400 bg-orange-400/10" },
  { value: "react", label: "React", color: "text-cyan-400 bg-cyan-400/10" },
  { value: "nextjs", label: "Next.js", color: "text-slate-300 bg-slate-700" },
  { value: "typescript", label: "TypeScript", color: "text-blue-300 bg-blue-300/10" },
];

const BLANK = { title: "", slug: "", language: "javascript", description: "", icon: "", order: 0, is_published: false };

const toSlug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {message}
    </div>
  );
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [slugEdited, setSlugEdited] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const load = () =>
    api.get<CourseListItem[]>("/api/courses/admin/all")
      .then(({ data }) => setCourses(data))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleTitleChange = (title: string) => {
    setForm(f => ({ ...f, title, slug: slugEdited ? f.slug : toSlug(title) }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/api/courses", form);
      setForm(BLANK);
      setSlugEdited(false);
      setShowForm(false);
      load();
      showToast("Course created successfully");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its topics and questions?`)) return;
    try {
      await api.delete(`/api/courses/${id}`);
      load();
      showToast(`"${title}" deleted`);
    } catch {
      showToast("Failed to delete course", "error");
    }
  };

  const togglePublish = async (course: CourseListItem) => {
    await api.put(`/api/courses/${course.id}`, { is_published: !course.is_published });
    load();
    showToast(course.is_published ? "Course unpublished" : "Course is now live");
  };

  const langMeta = (lang: string) =>
    LANGUAGE_OPTIONS.find(l => l.value === lang) || { label: lang, color: "text-slate-400 bg-surface-700" };

  return (
    <AdminLayout>
      <div className="p-8">
        {toast && <Toast {...toast} />}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Courses</h1>
            <p className="text-slate-400 text-sm mt-1">{courses.length} courses total</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setError(""); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Course
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="card mb-6 relative">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-100 font-semibold text-lg">New Course</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Title</label>
                  <input
                    className="input"
                    placeholder="e.g. JavaScript Fundamentals"
                    required
                    value={form.title}
                    onChange={e => handleTitleChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                    Slug <span className="text-slate-600 normal-case font-normal">(auto-generated)</span>
                  </label>
                  <input
                    className="input font-mono text-sm"
                    placeholder="javascript-fundamentals"
                    required
                    value={form.slug}
                    onChange={e => { setSlugEdited(true); setForm(f => ({ ...f, slug: e.target.value })); }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Language</label>
                  <select
                    className="input"
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                  >
                    {LANGUAGE_OPTIONS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Order</label>
                  <input
                    className="input"
                    type="number"
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Brief description of what students will learn..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.is_published}
                    onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  />
                  <div className="w-9 h-5 bg-surface-600 peer-checked:bg-brand-600 rounded-full transition-colors peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
                <span className="text-sm text-slate-300">Publish immediately</span>
              </div>
              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Creating..." : "Create Course"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Course List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse h-20 bg-surface-700" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">No courses yet</p>
            <p className="text-slate-500 text-sm mt-1">Create your first course to get started</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Course
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map(course => {
              const lang = langMeta(course.language);
              return (
                <div
                  key={course.id}
                  className="card flex items-center justify-between gap-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md shrink-0 ${lang.color}`}>
                      {lang.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-slate-100 font-medium">{course.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          course.is_published ? "bg-green-500/10 text-green-400" : "bg-slate-700 text-slate-400"
                        }`}>
                          {course.is_published ? "● Live" : "○ Draft"}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 text-xs">
                          <Layers className="w-3 h-3" /> {course.topic_count} topics
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => togglePublish(course)}
                      className="text-xs text-slate-400 hover:text-slate-200 border border-surface-600 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {course.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <Link
                      to={`/admin/courses/${course.id}/topics`}
                      state={{ courseTitle: course.title }}
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500/60 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Topics <ChevronRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id, course.title)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
