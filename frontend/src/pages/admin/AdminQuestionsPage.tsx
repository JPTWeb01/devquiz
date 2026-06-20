import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Eye, EyeOff, FileUp, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import api from "../../lib/api";
import type { AdminQuestion } from "../../lib/types";
import AdminLayout from "../../components/layout/AdminLayout";

const BLANK_FORM = {
  type: "mcq" as const,
  difficulty: "easy" as const,
  question_text: "",
  code_block: "",
  correct_answer: "",
  explanation: "",
  tags: "",
  points: 10,
  is_published: true,
  options: [
    { label: "A", text: "" },
    { label: "B", text: "" },
    { label: "C", text: "" },
    { label: "D", text: "" },
  ],
};

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

type GeneratedQuestion = {
  type: string;
  difficulty: string;
  question_text: string;
  code_block: string | null;
  options: { label: string; text: string }[] | null;
  correct_answer: string;
  explanation: string;
  points: number;
  selected?: boolean;
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

export default function AdminQuestionsPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const location = useLocation();
  const topicTitle = (location.state as any)?.topicTitle || "Questions";
  const courseTitle = (location.state as any)?.courseTitle || "";

  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [filterDiff, setFilterDiff] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([]);
  const [importingPdf, setImportingPdf] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiTab, setAiTab] = useState<"text" | "pdf">("text");
  const [aiCount, setAiCount] = useState(10);
  const [aiType, setAiType] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textGenerating, setTextGenerating] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const loadQuestions = () =>
    api.get<AdminQuestion[]>(`/api/questions?topic_id=${topicId}`)
      .then(({ data }) => setQuestions(data))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!topicId) return;
    loadQuestions();
  }, [topicId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/api/questions", {
        topic_id: topicId,
        type: form.type,
        difficulty: form.difficulty,
        question_text: form.question_text,
        correct_answer: form.correct_answer,
        explanation: form.explanation,
        points: form.points,
        is_published: form.is_published,
        tags: form.tags || null,
        code_block: form.code_block || null,
        options: form.type === "mcq" ? form.options : null,
      });
      setForm(BLANK_FORM);
      setShowForm(false);
      loadQuestions();
      showToast("Question added successfully");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create question");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question permanently?")) return;
    try {
      await api.delete(`/api/questions/${id}`);
      loadQuestions();
      showToast("Question deleted");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to delete question", "error");
    }
  };

  const togglePublish = async (q: AdminQuestion) => {
    setTogglingId(q.id);
    try {
      await api.patch(`/api/questions/${q.id}/publish`);
      loadQuestions();
      showToast(q.is_published ? "Question set to draft" : "Question published");
    } catch {
      showToast("Failed to update question status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const updateOption = (idx: number, text: string) =>
    setForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? { ...o, text } : o) }));

  const handleGenerateFromText = async () => {
    if (!textContent.trim() || !topicId) return;
    setTextGenerating(true);
    setPdfError("");
    setGenerated([]);
    try {
      const { data } = await api.post<{ questions: GeneratedQuestion[]; parsed_count: number }>(
        "/api/questions/from-text",
        { topic_id: topicId, content: textContent, count: aiCount, question_type: aiType }
      );
      setGenerated(data.questions.map(q => ({ ...q, selected: true })));
    } catch (err: any) {
      setPdfError(err.response?.data?.detail || "Failed to generate questions");
    } finally {
      setTextGenerating(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !topicId) return;
    setPdfUploading(true);
    setPdfError("");
    setGenerated([]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("topic_id", topicId);
      fd.append("count", String(aiCount));
      fd.append("question_type", aiType);
      const { data } = await api.post<{ questions: GeneratedQuestion[]; parsed_count: number }>(
        "/api/questions/from-pdf", fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setGenerated(data.questions.map(q => ({ ...q, selected: true })));
    } catch (err: any) {
      setPdfError(err.response?.data?.detail || "Failed to generate from PDF");
    } finally {
      setPdfUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImportSelected = async () => {
    const toImport = generated.filter(q => q.selected);
    if (!toImport.length) return;
    setImportingPdf(true);
    setPdfError("");
    try {
      const results = await Promise.allSettled(
        toImport.map(q =>
          api.post("/api/questions", { ...q, topic_id: topicId, is_published: true })
        )
      );
      const succeeded = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      setGenerated([]);
      setShowAI(false);
      loadQuestions();
      if (failed === 0) {
        showToast(`${succeeded} questions imported successfully`);
      } else {
        showToast(`${succeeded} imported, ${failed} failed`, "error");
      }
    } catch {
      setPdfError("Import failed. Please try again.");
    } finally {
      setImportingPdf(false);
    }
  };

  const toggleGenerated = (idx: number) =>
    setGenerated(g => g.map((q, i) => i === idx ? { ...q, selected: !q.selected } : q));

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleBulkPublish = async () => {
    const toPublish = questions.filter(q => selectedIds.has(q.id) && !q.is_published);
    if (!toPublish.length) { showToast("All selected questions are already published"); return; }
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(toPublish.map(q => api.patch(`/api/questions/${q.id}/publish`)));
      const succeeded = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      setSelectedIds(new Set());
      loadQuestions();
      if (failed === 0) {
        showToast(`${succeeded} question${succeeded !== 1 ? "s" : ""} published`);
      } else {
        showToast(`${succeeded} published, ${failed} failed`, "error");
      }
    } catch {
      showToast("Bulk action failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkUnpublish = async () => {
    const toUnpublish = questions.filter(q => selectedIds.has(q.id) && q.is_published);
    if (!toUnpublish.length) { showToast("No published questions in selection"); return; }
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(toUnpublish.map(q => api.patch(`/api/questions/${q.id}/publish`)));
      const succeeded = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      setSelectedIds(new Set());
      loadQuestions();
      if (failed === 0) {
        showToast(`${succeeded} question${succeeded !== 1 ? "s" : ""} unpublished`);
      } else {
        showToast(`${succeeded} unpublished, ${failed} failed`, "error");
      }
    } catch {
      showToast("Bulk action failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const filtered = questions.filter(q => {
    if (filterDiff !== "all" && q.difficulty !== filterDiff) return false;
    if (filterType !== "all" && q.type !== filterType) return false;
    return true;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every(q => selectedIds.has(q.id));

  const toggleSelectAll = () =>
    setSelectedIds(allFilteredSelected ? new Set() : new Set(filtered.map(q => q.id)));

  const counts = {
    easy: questions.filter(q => q.difficulty === "easy").length,
    medium: questions.filter(q => q.difficulty === "medium").length,
    hard: questions.filter(q => q.difficulty === "hard").length,
    published: questions.filter(q => q.is_published).length,
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
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
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-100">{topicTitle}</h1>
            <p className="text-slate-400 text-sm mt-1">{questions.length} questions total</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setShowAI(!showAI); setGenerated([]); setPdfError(""); }}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <FileUp className="w-4 h-4" /> Generate with AI
            </button>
            <button
              onClick={() => { setShowForm(true); setError(""); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        </div>

        {/* Stats summary */}
        {questions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Easy", count: counts.easy, color: "text-green-400 bg-green-400/10" },
              { label: "Medium", count: counts.medium, color: "text-yellow-400 bg-yellow-400/10" },
              { label: "Hard", count: counts.hard, color: "text-red-400 bg-red-400/10" },
              { label: "Published", count: counts.published, color: "text-blue-400 bg-blue-400/10" },
            ].map(({ label, count, color }) => (
              <div key={label} className="bg-surface-800 border border-surface-700 rounded-lg p-3 text-center">
                <p className={`text-lg font-bold ${color.split(" ")[0]}`}>{count}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* AI Generation Panel */}
        {showAI && (
          <div className="card mb-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-slate-100 font-semibold">Generate Questions with AI</h2>
                <p className="text-slate-500 text-sm mt-0.5">Paste content or upload a PDF — AI generates quiz questions instantly</p>
              </div>
              <button onClick={() => { setShowAI(false); setGenerated([]); setTextContent(""); setPdfError(""); }}
                className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-700 p-1 rounded-lg mb-5 w-fit">
              <button
                onClick={() => { setAiTab("text"); setGenerated([]); setPdfError(""); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  aiTab === "text" ? "bg-surface-800 text-slate-100 shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Paste Text
              </button>
              <button
                onClick={() => { setAiTab("pdf"); setGenerated([]); setPdfError(""); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  aiTab === "pdf" ? "bg-surface-800 text-slate-100 shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Upload PDF
              </button>
            </div>

            {/* Count + Type controls */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap">Questions</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={aiCount}
                  onChange={e => setAiCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="input w-20 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap">Type</label>
                <select
                  value={aiType}
                  onChange={e => setAiType(e.target.value)}
                  className="input text-sm flex-1"
                >
                  <option value="">Mixed (all types)</option>
                  <option value="mcq">Multiple Choice</option>
                  <option value="predict_output">Predict Output</option>
                  <option value="fill_blank">Fill in Blank</option>
                  <option value="debugging">Debugging</option>
                  <option value="code_writing">Code Writing</option>
                </select>
              </div>
            </div>

            {/* Text tab */}
            {aiTab === "text" && (
              <div className="space-y-3">
                <textarea
                  className="input resize-none font-mono text-sm leading-relaxed"
                  rows={8}
                  placeholder={`Paste any content here and AI will generate questions from it.\n\nExamples:\n• A JavaScript concept explanation\n• A code snippet with notes\n• A topic summary\n• Lecture notes or documentation`}
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <p className="text-slate-600 text-xs">{textContent.length} characters</p>
                  <button
                    onClick={handleGenerateFromText}
                    disabled={textGenerating || textContent.trim().length < 30}
                    className="btn-primary flex items-center gap-2"
                  >
                    {textGenerating
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      : "Generate Questions"
                    }
                  </button>
                </div>
              </div>
            )}

            {/* PDF tab */}
            {aiTab === "pdf" && (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-surface-600 hover:border-blue-500/50 rounded-lg p-10 text-center cursor-pointer transition-colors group"
                >
                  <FileUp className="w-10 h-10 text-slate-600 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
                  <p className="text-slate-300 font-medium">Click to upload a PDF</p>
                  <p className="text-slate-500 text-sm mt-1">AI will read the content and generate questions</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                {pdfUploading && (
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Reading PDF and generating questions...
                  </div>
                )}
              </div>
            )}

            {pdfError && (
              <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg mt-3">{pdfError}</p>
            )}

            {/* Generated questions preview */}
            {generated.length > 0 && (
              <div className="mt-5 pt-5 border-t border-surface-700">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-300 text-sm font-medium">
                    {generated.length} questions generated — select which to import
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setGenerated(g => g.map(q => ({ ...q, selected: true })))}
                      className="text-xs text-blue-400 hover:text-blue-300">Select all</button>
                    <button onClick={() => setGenerated(g => g.map(q => ({ ...q, selected: false })))}
                      className="text-xs text-slate-500 hover:text-slate-300">Deselect all</button>
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto mb-4 pr-1">
                  {generated.map((q, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleGenerated(idx)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        q.selected
                          ? "border-blue-500/40 bg-blue-500/5"
                          : "border-surface-600 bg-surface-700 opacity-40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${DIFFICULTY_COLORS[q.difficulty] || ""}`}>
                          {q.difficulty}
                        </span>
                        <span className="text-xs text-slate-500 bg-surface-700 px-1.5 py-0.5 rounded">
                          {TYPE_LABELS[q.type] || q.type}
                        </span>
                        <span className="text-xs text-slate-600 ml-auto">{q.points}pts</span>
                      </div>
                      <p className="text-slate-200 text-sm leading-snug">{q.question_text}</p>
                      <p className="text-slate-500 text-xs mt-1.5 font-mono">✓ {q.correct_answer}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleImportSelected}
                  disabled={importingPdf || !generated.some(q => q.selected)}
                  className="btn-primary flex items-center gap-2"
                >
                  {importingPdf
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                    : <><Save className="w-4 h-4" /> Import {generated.filter(q => q.selected).length} Questions</>
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Question Form */}
        {showForm && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-100 font-semibold text-lg">New Question</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Type</label>
                  <select
                    className="input"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                  >
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Difficulty</label>
                  <select
                    className="input"
                    value={form.difficulty}
                    onChange={e => {
                      const d = e.target.value as any;
                      const pts = d === "easy" ? 10 : d === "medium" ? 15 : 20;
                      setForm(f => ({ ...f, difficulty: d, points: pts }));
                    }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Points</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={100}
                    value={form.points}
                    onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Question</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  required
                  placeholder="What does this code output?"
                  value={form.question_text}
                  onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  Code Block <span className="text-slate-600 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  className="input font-mono text-sm resize-none"
                  rows={4}
                  placeholder="Paste code here..."
                  value={form.code_block}
                  onChange={e => setForm(f => ({ ...f, code_block: e.target.value }))}
                />
              </div>

              {form.type === "mcq" && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Options</label>
                  <div className="space-y-2">
                    {form.options.map((opt, idx) => (
                      <div key={opt.label} className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono text-sm w-5 shrink-0">{opt.label}.</span>
                        <input
                          className="input flex-1"
                          value={opt.text}
                          onChange={e => updateOption(idx, e.target.value)}
                          placeholder={`Option ${opt.label}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                    Correct Answer {form.type === "mcq" ? "(A, B, C or D)" : ""}
                  </label>
                  <input
                    className="input font-mono"
                    required
                    placeholder={form.type === "mcq" ? "A" : "exact answer..."}
                    value={form.correct_answer}
                    onChange={e => setForm(f => ({ ...f, correct_answer: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Tags</label>
                  <input
                    className="input"
                    placeholder="loops, arrays, scope..."
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Explanation</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  required
                  placeholder="Explain why this is the correct answer..."
                  value={form.explanation}
                  onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
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

              {error && <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Adding..." : "Add Question"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        {questions.length > 0 && (
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-slate-500 text-sm">Filter:</span>
            {["all", "easy", "medium", "hard"].map(d => (
              <button
                key={d}
                onClick={() => setFilterDiff(d)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  filterDiff === d
                    ? "bg-brand-600 text-white"
                    : "bg-surface-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                {d === "all" ? "All Difficulties" : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
            <span className="text-slate-700">|</span>
            {["all", "mcq", "predict_output", "fill_blank", "debugging"].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === t
                    ? "bg-brand-600 text-white"
                    : "bg-surface-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t === "all" ? "All Types" : TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-surface-700" />)}
          </div>
        ) : questions.length === 0 ? (
          <div className="card text-center py-16">
            <FileUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 font-medium">No questions yet</p>
            <p className="text-slate-500 text-sm mt-1">Add questions manually or generate them from a PDF</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Manually
              </button>
              <button onClick={() => setShowAI(true)} className="btn-ghost inline-flex items-center gap-2">
                <FileUp className="w-4 h-4" /> Generate with AI
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No questions match your filters.</p>
        ) : (
          <>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-brand-500/10 border border-brand-500/20 rounded-lg">
                <span className="text-sm text-slate-300 flex-1">{selectedIds.size} selected</span>
                <button
                  onClick={handleBulkPublish}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20"
                >
                  {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                  Publish
                </button>
                <button
                  onClick={handleBulkUnpublish}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 text-slate-400 border-surface-600 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                >
                  {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Unpublish
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mb-2 px-1">
              <input
                type="checkbox"
                id="select-all-q"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 cursor-pointer accent-violet-500"
              />
              <label htmlFor="select-all-q" className="text-xs text-slate-500 cursor-pointer select-none">
                Select all ({filtered.length})
              </label>
            </div>
            <div className="space-y-3">
            {filtered.map((q, idx) => (
              <div
                key={q.id}
                className={`card flex items-start justify-between gap-4 hover:border-slate-600 transition-colors border-l-4 ${
                  q.is_published ? "border-l-green-500/60" : "border-l-slate-600"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(q.id)}
                    onChange={() => toggleSelect(q.id)}
                    onClick={e => e.stopPropagation()}
                    className="mt-1 w-4 h-4 shrink-0 cursor-pointer accent-violet-500"
                  />
                  <span className="text-slate-600 font-mono text-sm mt-0.5 w-6 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
                        {q.difficulty}
                      </span>
                      <span className="text-xs text-slate-500 bg-surface-700 px-2 py-0.5 rounded-md">
                        {TYPE_LABELS[q.type] || q.type}
                      </span>
                      <span className="text-xs text-slate-600">{q.points}pts</span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                        q.is_published
                          ? "bg-green-500/10 text-green-400"
                          : "bg-slate-700 text-slate-400"
                      }`}>
                        {q.is_published
                          ? <><Eye className="w-3 h-3" /> Published</>
                          : <><EyeOff className="w-3 h-3" /> Draft</>
                        }
                      </span>
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed">{q.question_text}</p>
                    <p className="text-slate-500 text-xs mt-1 font-mono">
                      ✓ {q.correct_answer}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePublish(q)}
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
                    {q.is_published ? "Published" : "Draft"}
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
