import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2, PlayCircle, SendHorizontal, Sparkles, X, XCircle } from "lucide-react";
import api from "../lib/api";
import type { QuizSession, AnswerResult, Question } from "../lib/types";
import QuestionRenderer from "../components/quiz/QuestionRenderer";

type Step = "setup" | "loading" | "quiz" | "feedback" | "done";

const DIFFICULTIES = [
  { value: "", label: "All Levels" },
  { value: "easy", label: "Easy", color: "text-green-400 border-green-500/40 bg-green-500/5" },
  { value: "medium", label: "Medium", color: "text-yellow-400 border-yellow-500/40 bg-yellow-500/5" },
  { value: "hard", label: "Hard", color: "text-red-400 border-red-500/40 bg-red-500/5" },
];

const TYPES = [
  { value: "", label: "All Types" },
  { value: "mcq", label: "Multiple Choice" },
  { value: "predict_output", label: "Predict Output" },
  { value: "fill_blank", label: "Fill in Blank" },
  { value: "debugging", label: "Debugging" },
  { value: "code_writing", label: "Code Writing" },
];

const COUNTS = [5, 10, 15, 20];

export default function QuizPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const topicId = params.get("topic") || "";
  const topicTitle = params.get("title") || "Quiz";

  // Setup options
  const [difficulty, setDifficulty] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [questionCount, setQuestionCount] = useState(10);

  // Quiz state
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [step, setStep] = useState<Step>("setup");
  const [error, setError] = useState("");

  // AI Tutor chat
  type ChatMessage = { role: "user" | "tutor"; text: string };
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<ChatMessage[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);
  const tutorEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!topicId) navigate("/courses");
  }, [topicId]);

  const handleStart = async () => {
    setStep("loading");
    setError("");
    try {
      const { data } = await api.post<QuizSession>("/api/quiz/start", {
        topic_id: topicId,
        question_count: questionCount,
        difficulty: difficulty || null,
        question_type: questionType || null,
      });
      setSession(data);
      setStep("quiz");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to start quiz. Not enough questions for your selection.");
      setStep("setup");
    }
  };

  const currentQuestion: Question | undefined = session?.questions[currentIdx];

  const handleSubmit = async () => {
    if (!answer.trim() || !session || !currentQuestion) return;
    try {
      const { data } = await api.post<AnswerResult>("/api/quiz/answer", {
        session_id: session.session_id,
        question_id: currentQuestion.id,
        answer,
      });
      setFeedback(data);
      setStep("feedback");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit answer");
    }
  };

  const handleNext = () => {
    if (!session) return;
    const nextIdx = currentIdx + 1;
    if (nextIdx < session.questions.length) {
      setCurrentIdx(nextIdx);
      setAnswer("");
      setFeedback(null);
      setTutorOpen(false);
      setTutorMessages([]);
      setTutorInput("");
      setStep("quiz");
    } else {
      navigate(`/quiz/results/${session.session_id}`);
    }
  };

  useEffect(() => {
    tutorEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tutorMessages, tutorLoading]);

  const sendTutorMessage = async (userMsg: string | null, currentMsgs: ChatMessage[]) => {
    if (!currentQuestion || !feedback) return;
    setTutorLoading(true);
    try {
      const history = currentMsgs.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));
      const { data } = await api.post<{ explanation: string }>("/api/ai/tutor", {
        question_text: currentQuestion.question_text,
        question_type: currentQuestion.type,
        correct_answer: feedback.correct_answer,
        user_answer: answer,
        explanation: feedback.explanation,
        is_correct: feedback.is_correct,
        code_block: currentQuestion.code_block,
        history,
        message: userMsg,
      });
      setTutorMessages(prev => [...prev, { role: "tutor", text: data.explanation }]);
    } catch {
      setTutorMessages(prev => [...prev, { role: "tutor", text: "Sorry, I'm unavailable right now." }]);
    } finally {
      setTutorLoading(false);
    }
  };

  const openTutor = () => {
    setTutorOpen(true);
    if (tutorMessages.length === 0) sendTutorMessage(null, []);
  };

  const handleTutorSend = () => {
    const msg = tutorInput.trim();
    if (!msg || tutorLoading) return;
    const updated: ChatMessage[] = [...tutorMessages, { role: "user", text: msg }];
    setTutorMessages(updated);
    setTutorInput("");
    sendTutorMessage(msg, updated);
  };

  // ── Setup screen ──────────────────────────────────────────────
  if (step === "setup") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          to="/courses"
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Set Up Your Quiz</h1>
          <p className="text-slate-400 mt-1">{topicTitle}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Difficulty */}
        <div className="card mb-4">
          <p className="text-slate-300 font-medium mb-3">Difficulty</p>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  difficulty === d.value
                    ? d.color || "text-blue-400 border-blue-500/40 bg-blue-500/5"
                    : "text-slate-400 border-surface-600 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question Type */}
        <div className="card mb-4">
          <p className="text-slate-300 font-medium mb-3">Question Type</p>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setQuestionType(t.value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  questionType === t.value
                    ? "text-blue-400 border-blue-500/40 bg-blue-500/5"
                    : "text-slate-400 border-surface-600 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="card mb-8">
          <p className="text-slate-300 font-medium mb-3">Number of Questions</p>
          <div className="flex gap-2">
            {COUNTS.map(c => (
              <button
                key={c}
                onClick={() => setQuestionCount(c)}
                className={`w-14 py-2 rounded-lg border text-sm font-medium transition-all ${
                  questionCount === c
                    ? "text-blue-400 border-blue-500/40 bg-blue-500/5"
                    : "text-slate-400 border-surface-600 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-slate-500 text-sm flex-1">
            {questionCount} questions ·{" "}
            {difficulty ? DIFFICULTIES.find(d => d.value === difficulty)?.label : "All Levels"} ·{" "}
            {questionType ? TYPES.find(t => t.value === questionType)?.label : "All Types"}
          </p>
          <button onClick={handleStart} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
            <PlayCircle className="w-5 h-5" /> Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        Starting quiz...
      </div>
    );
  }

  if (!session || !currentQuestion) return null;

  const progress = (currentIdx / session.total_questions) * 100;

  // ── Quiz screen ───────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">
          Question {currentIdx + 1} of {session.total_questions}
        </span>
        <span className="text-slate-400 text-sm font-mono">{currentQuestion.points} pts</span>
      </div>
      <div className="w-full bg-surface-700 rounded-full h-1.5 mb-8">
        <div
          className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            currentQuestion.difficulty === "easy"
              ? "bg-green-500/10 text-green-400"
              : currentQuestion.difficulty === "medium"
              ? "bg-yellow-500/10 text-yellow-400"
              : "bg-red-500/10 text-red-400"
          }`}>
            {currentQuestion.difficulty}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {currentQuestion.type.replace(/_/g, " ")}
          </span>
        </div>

        <QuestionRenderer
          question={currentQuestion}
          selectedAnswer={answer}
          onAnswer={setAnswer}
          disabled={step === "feedback"}
        />

        {error && (
          <p className="mt-4 text-red-400 text-sm">{error}</p>
        )}

        {step === "feedback" && feedback && (
          <div className={`mt-6 p-4 rounded-lg border ${
            feedback.is_correct
              ? "border-green-500/30 bg-green-500/10"
              : "border-red-500/30 bg-red-500/10"
          }`}>
            <div className="flex items-center gap-2 font-medium mb-2">
              {feedback.is_correct ? (
                <><CheckCircle className="w-5 h-5 text-green-400" /><span className="text-green-400">Correct! +{feedback.points_earned} pts</span></>
              ) : (
                <><XCircle className="w-5 h-5 text-red-400" /><span className="text-red-400">Incorrect</span></>
              )}
            </div>
            {!feedback.is_correct && (
              <p className="text-slate-300 text-sm mb-1">
                Answer: <span className="font-mono text-green-400">{feedback.correct_answer}</span>
              </p>
            )}
            <p className="text-slate-400 text-sm">{feedback.explanation}</p>

            {/* AI Tutor */}
            {!tutorOpen && (
              <button
                onClick={openTutor}
                className="mt-3 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Ask AI Tutor
              </button>
            )}
            {tutorOpen && (
              <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
                {/* Chat header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-blue-500/15">
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5" /> AI Tutor
                  </div>
                  <button
                    onClick={() => setTutorOpen(false)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Messages */}
                <div className="px-4 py-3 space-y-3 max-h-64 overflow-y-auto">
                  {tutorMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-brand-600/20 text-slate-200 border border-brand-500/20"
                          : "bg-surface-700 text-slate-300 border border-surface-600"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {tutorLoading && (
                    <div className="flex justify-start">
                      <div className="bg-surface-700 border border-surface-600 px-3 py-2 rounded-xl flex items-center gap-2 text-slate-400 text-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={tutorEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-blue-500/15 flex gap-2">
                  <input
                    type="text"
                    value={tutorInput}
                    onChange={e => setTutorInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTutorSend(); }
                    }}
                    placeholder="Ask a follow-up question..."
                    disabled={tutorLoading}
                    className="flex-1 bg-surface-700 border border-surface-600 text-slate-200 text-sm rounded-lg px-3 py-2 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
                  />
                  <button
                    onClick={handleTutorSend}
                    disabled={!tutorInput.trim() || tutorLoading}
                    className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <SendHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {step === "quiz" ? (
            <button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              className="btn-primary"
            >
              Submit Answer
            </button>
          ) : (
            <button onClick={handleNext} className="btn-primary">
              {currentIdx + 1 < session.total_questions ? "Next Question" : "See Results"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
