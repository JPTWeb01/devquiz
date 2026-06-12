import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronRight, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import api from "../../lib/api";
import type { Terminology } from "../../lib/types";
import AdminLayout from "../../components/layout/AdminLayout";

const BLANK = { term: "", meaning: "", order: 0 };

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {message}
    </div>
  );
}

export default function AdminTerminologyPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const location = useLocation();
  const topicTitle = (location.state as any)?.topicTitle || "Topic";
  const courseTitle = (location.state as any)?.courseTitle || "";

  const [terms, setTerms] = useState<Terminology[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const loadTerms = () =>
    api.get<Terminology[]>(`/api/topics/${topicId}/terminology`)
      .then(({ data }) => setTerms(data))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!topicId) return;
    loadTerms();
  }, [topicId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(BLANK);
    setError("");
    setShowForm(true);
  };

  const openEdit = (t: Terminology) => {
    setEditingId(t.id);
    setForm({ term: t.term, meaning: t.meaning, order: t.order });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await api.put(`/api/terminology/${editingId}`, form);
        showToast("Term updated");
      } else {
        await api.post(`/api/topics/${topicId}/terminology`, form);
        showToast("Term added");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(BLANK);
      loadTerms();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save term");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, term: string) => {
    if (!confirm(`Delete "${term}"?`)) return;
    try {
      await api.delete(`/api/terminology/${id}`);
      loadTerms();
      showToast(`"${term}" deleted`);
    } catch {
      showToast("Failed to delete term", "error");
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {toast && <Toast {...toast} />}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap">
          <Link to="/admin/courses" className="hover:text-slate-300 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Courses
          </Link>
          {courseTitle && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-400">{courseTitle}</span>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300">{topicTitle}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300">Terminology</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-400" />
              Terminology
            </h1>
            <p className="text-slate-400 text-sm mt-1">{topicTitle} — {terms.length} terms</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Term
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-100 font-semibold text-lg">
                {editingId ? "Edit Term" : "New Term"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Term</label>
                  <input
                    className="input"
                    placeholder="e.g. Variable"
                    required
                    value={form.term}
                    onChange={e => setForm(f => ({ ...f, term: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Order</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Meaning</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  required
                  placeholder="A named storage location that holds a value which can change during program execution."
                  value={form.meaning}
                  onChange={e => setForm(f => ({ ...f, meaning: e.target.value }))}
                />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex items-center gap-3 pt-1">
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : editingId ? "Update Term" : "Add Term"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Terms List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-surface-700" />)}
          </div>
        ) : terms.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">No terms yet</p>
            <p className="text-slate-500 text-sm mt-1">Add key terms and their meanings for this topic</p>
            <button onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add First Term
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {terms.map((t, idx) => (
              <div
                key={t.id}
                className="card flex items-start justify-between gap-4 hover:border-slate-600 transition-colors border-l-4 border-l-blue-500/40"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-slate-600 font-mono text-sm mt-0.5 w-6 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-slate-100 font-semibold">{t.term}</p>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">{t.meaning}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.term)}
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
