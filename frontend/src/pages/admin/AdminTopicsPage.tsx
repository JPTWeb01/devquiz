import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, FileQuestion, Plus, Trash2, X } from "lucide-react";
import api from "../../lib/api";
import type { Topic, CourseListItem } from "../../lib/types";
import AdminLayout from "../../components/layout/AdminLayout";

const BLANK = { title: "", slug: "", description: "", order: 0, is_published: false };

const toSlug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {message}
    </div>
  );
}

export default function AdminTopicsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const courseTitle = (location.state as any)?.courseTitle || "Course";

  const [topics, setTopics] = useState<(Topic & { is_published: boolean })[]>([]);
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

  const loadTopics = () =>
    api.get<(Topic & { is_published: boolean })[]>(`/api/courses/${courseId}/topics/admin`)
      .then(({ data }) => setTopics(data))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!courseId) return;
    loadTopics();
  }, [courseId]);

  const handleTitleChange = (title: string) => {
    setForm(f => ({ ...f, title, slug: slugEdited ? f.slug : toSlug(title) }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post(`/api/courses/${courseId}/topics`, form);
      setForm(BLANK);
      setSlugEdited(false);
      setShowForm(false);
      loadTopics();
      showToast("Topic created successfully");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create topic");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its questions?`)) return;
    try {
      await api.delete(`/api/courses/topics/${id}`);
      loadTopics();
      showToast(`"${title}" deleted`);
    } catch {
      showToast("Failed to delete topic", "error");
    }
  };

  const togglePublish = async (topic: Topic & { is_published: boolean }) => {
    await api.put(`/api/courses/topics/${topic.id}`, { is_published: !topic.is_published });
    loadTopics();
    showToast(topic.is_published ? "Topic unpublished" : "Topic is now live");
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {toast && <Toast {...toast} />}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/admin/courses" className="hover:text-slate-300 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Courses
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300">{courseTitle}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{courseTitle}</h1>
            <p className="text-slate-400 text-sm mt-1">{topics.length} topics</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setError(""); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Topic
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-100 font-semibold text-lg">New Topic</h2>
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
                    placeholder="e.g. Variables & Data Types"
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
                    required
                    value={form.slug}
                    onChange={e => { setSlugEdited(true); setForm(f => ({ ...f, slug: e.target.value })); }}
                  />
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
                <div className="flex items-center gap-3 mt-5">
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
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="What will students learn in this topic?"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Creating..." : "Create Topic"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Topics List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card h-16 animate-pulse bg-surface-700" />)}
          </div>
        ) : topics.length === 0 ? (
          <div className="card text-center py-16">
            <FileQuestion className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">No topics yet</p>
            <p className="text-slate-500 text-sm mt-1">Add topics to organize your questions</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Topic
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic, idx) => (
              <div
                key={topic.id}
                className="card flex items-center justify-between gap-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-slate-600 font-mono text-sm w-6 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-slate-100 font-medium">{topic.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        topic.is_published ? "bg-green-500/10 text-green-400" : "bg-slate-700 text-slate-400"
                      }`}>
                        {topic.is_published ? "● Live" : "○ Draft"}
                      </span>
                      {topic.description && (
                        <p className="text-slate-500 text-xs truncate">{topic.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePublish(topic)}
                    className="text-xs text-slate-400 hover:text-slate-200 border border-surface-600 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {topic.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <Link
                    to={`/admin/topics/${topic.id}/questions`}
                    state={{ topicTitle: topic.title, courseTitle }}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500/60 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Questions <ChevronRight className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => handleDelete(topic.id, topic.title)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
