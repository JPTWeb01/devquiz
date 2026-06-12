import { useEffect, useState } from "react";
import { Calendar, Loader2, Play, Plus, Trash2, X } from "lucide-react";
import api from "../../lib/api";
import AdminLayout from "../../components/layout/AdminLayout";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const QUESTION_TYPES = [
  { value: "", label: "Mixed" },
  { value: "mcq", label: "Multiple Choice" },
  { value: "predict_output", label: "Predict Output" },
  { value: "fill_blank", label: "Fill in Blank" },
  { value: "debugging", label: "Debugging" },
  { value: "code_writing", label: "Code Writing" },
];

interface ScheduleEntry {
  id: string;
  day_of_week: number;
  day_name: string;
  topic_id: string;
  topic_title: string;
  course_title: string;
  question_count: number;
  question_type: string;
  is_active: boolean;
  last_run_at: string | null;
}

interface TopicOption {
  id: string;
  title: string;
  course_title: string;
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {message}
    </div>
  );
}

const selectCls = "bg-surface-600 border border-surface-500 text-slate-100 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default function AdminSchedulePage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Add form state
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [newTopic, setNewTopic] = useState("");
  const [newCount, setNewCount] = useState(5);
  const [newType, setNewType] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const load = () =>
    api.get<ScheduleEntry[]>("/api/schedule")
      .then(({ data }) => setEntries(data))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    api.get<TopicOption[]>("/api/schedule/topics").then(({ data }) => setTopics(data));
  }, []);

  const entriesForDay = (day: number) => entries.filter(e => e.day_of_week === day);

  const totalPerWeek = entries.filter(e => e.is_active).reduce((sum, e) => sum + e.question_count, 0);

  const handleAdd = async (day: number) => {
    if (!newTopic) return;
    setAddSaving(true);
    setAddError("");
    try {
      await api.post("/api/schedule", {
        day_of_week: day,
        topic_id: newTopic,
        question_count: newCount,
        question_type: newType,
      });
      setAddingDay(null);
      setNewTopic("");
      setNewCount(5);
      setNewType("");
      load();
      showToast("Schedule added");
    } catch (err: any) {
      setAddError(err.response?.data?.detail || "Failed to add schedule");
    } finally {
      setAddSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/schedule/${id}`);
      load();
      showToast("Removed from schedule");
    } catch {
      showToast("Failed to remove", "error");
    }
  };

  const handleToggle = async (entry: ScheduleEntry) => {
    try {
      await api.put(`/api/schedule/${entry.id}`, { is_active: !entry.is_active });
      load();
    } catch {
      showToast("Failed to update", "error");
    }
  };

  const handleUpdateCount = async (entry: ScheduleEntry, count: number) => {
    try {
      await api.put(`/api/schedule/${entry.id}`, { question_count: count });
      load();
    } catch {
      showToast("Failed to update", "error");
    }
  };

  const handleUpdateType = async (entry: ScheduleEntry, question_type: string) => {
    try {
      await api.put(`/api/schedule/${entry.id}`, { question_type });
      load();
    } catch {
      showToast("Failed to update", "error");
    }
  };

  const handleTriggerNow = async () => {
    setTriggering(true);
    try {
      await api.post("/api/schedule/trigger");
      showToast("Today's schedule triggered — check Questions pages for new drafts");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Trigger failed", "error");
    } finally {
      setTriggering(false);
    }
  };

  const openAdd = (day: number) => {
    setAddingDay(day);
    setNewTopic("");
    setNewCount(5);
    setNewType("");
    setAddError("");
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {toast && <Toast {...toast} />}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Auto-Generate Schedule</h1>
            <p className="text-slate-400 text-sm mt-1">
              Set which topics generate questions each day of the week
            </p>
          </div>
          <button
            onClick={handleTriggerNow}
            disabled={triggering}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {triggering ? "Running..." : "Run Today Now"}
          </button>
        </div>

        {/* Weekly summary */}
        <div className="card mb-6 flex items-center gap-6">
          <Calendar className="w-8 h-8 text-blue-400 shrink-0" />
          <div>
            <p className="text-slate-100 font-semibold">
              {totalPerWeek} questions / week
            </p>
            <p className="text-slate-500 text-sm mt-0.5">
              Runs automatically every day at midnight UTC — new questions are saved as <span className="text-yellow-400">drafts</span> for you to review and publish.
            </p>
          </div>
        </div>

        {/* Weekly grid */}
        {loading ? (
          <div className="space-y-3">
            {DAYS.map(d => <div key={d} className="card h-20 animate-pulse bg-surface-700" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {DAYS.map((dayName, dayIdx) => {
              const dayEntries = entriesForDay(dayIdx);
              const isAdding = addingDay === dayIdx;

              return (
                <div key={dayIdx} className="card">
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-100 font-semibold w-28">{dayName}</span>
                      {dayEntries.length > 0 && (
                        <span className="text-xs text-slate-500">
                          {dayEntries.filter(e => e.is_active).reduce((s, e) => s + e.question_count, 0)} questions
                        </span>
                      )}
                    </div>
                    {!isAdding && (
                      <button
                        onClick={() => openAdd(dayIdx)}
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500/60 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Topic
                      </button>
                    )}
                  </div>

                  {/* Existing entries */}
                  {dayEntries.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {dayEntries.map(entry => (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                            entry.is_active
                              ? "border-surface-600 bg-surface-700"
                              : "border-surface-700 bg-surface-800 opacity-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-slate-200 text-sm font-medium truncate">{entry.topic_title}</p>
                            <p className="text-slate-500 text-xs">{entry.course_title}</p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Question count picker */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 text-xs">Qty:</span>
                              <select
                                className={selectCls}
                                value={entry.question_count}
                                onChange={e => handleUpdateCount(entry, parseInt(e.target.value))}
                              >
                                {[2, 3, 5, 8, 10, 15, 20].map(n => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                            </div>

                            {/* Question type picker */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 text-xs">Type:</span>
                              <select
                                className={selectCls}
                                value={entry.question_type}
                                onChange={e => handleUpdateType(entry, e.target.value)}
                              >
                                {QUESTION_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>

                            {/* Active toggle */}
                            <button
                              onClick={() => handleToggle(entry)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                entry.is_active
                                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                                  : "bg-slate-700 text-slate-500 border-surface-600"
                              }`}
                            >
                              {entry.is_active ? "On" : "Off"}
                            </button>

                            {/* Last run */}
                            {entry.last_run_at && (
                              <span className="text-slate-600 text-xs hidden md:block">
                                Last: {new Date(entry.last_run_at).toLocaleDateString()}
                              </span>
                            )}

                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add form */}
                  {isAdding && (
                    <div className="border border-blue-500/20 bg-blue-500/5 rounded-lg p-3 mt-2">
                      <div className="flex items-start gap-3 flex-wrap">
                        <div className="flex-1 min-w-40">
                          <label className="block text-xs text-slate-400 mb-1">Topic</label>
                          <select
                            className="input text-sm"
                            value={newTopic}
                            onChange={e => setNewTopic(e.target.value)}
                          >
                            <option value="">Select a topic...</option>
                            {topics
                              .filter(t => !dayEntries.some(e => e.topic_id === t.id))
                              .map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.course_title} — {t.title}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="block text-xs text-slate-400 mb-1">Questions</label>
                          <input
                            className="input text-sm"
                            type="number"
                            min={1}
                            max={20}
                            value={newCount}
                            onChange={e => setNewCount(parseInt(e.target.value) || 5)}
                          />
                        </div>
                        <div className="w-40">
                          <label className="block text-xs text-slate-400 mb-1">Type</label>
                          <select
                            className="input text-sm"
                            value={newType}
                            onChange={e => setNewType(e.target.value)}
                          >
                            {QUESTION_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 mt-5">
                          <button
                            onClick={() => handleAdd(dayIdx)}
                            disabled={!newTopic || addSaving}
                            className="btn-primary text-sm py-2"
                          >
                            {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                          </button>
                          <button
                            onClick={() => setAddingDay(null)}
                            className="p-2 text-slate-500 hover:text-slate-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {addError && <p className="text-red-400 text-xs mt-2">{addError}</p>}
                    </div>
                  )}

                  {dayEntries.length === 0 && !isAdding && (
                    <p className="text-slate-600 text-sm">No topics scheduled for {dayName}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
