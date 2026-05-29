import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import api from "../lib/api";
import type { QuizSession, AnswerResult, Question } from "../lib/types";
import QuestionRenderer from "../components/quiz/QuestionRenderer";

type Step = "loading" | "quiz" | "feedback" | "done";

export default function QuizPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const topicId = params.get("topic") || "";

  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!topicId) { navigate("/courses"); return; }
    api.post<QuizSession>("/api/quiz/start", { topic_id: topicId, question_count: 10 })
      .then(({ data }) => { setSession(data); setStep("quiz"); })
      .catch(() => { setError("Failed to start quiz"); setStep("done"); });
  }, [topicId]);

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
    } catch {
      setError("Failed to submit answer");
    }
  };

  const handleNext = () => {
    const nextIdx = currentIdx + 1;
    if (session && nextIdx < session.questions.length) {
      setCurrentIdx(nextIdx);
      setAnswer("");
      setFeedback(null);
      setStep("quiz");
    } else {
      navigate(`/quiz/results/${session?.session_id}`);
    }
  };

  if (step === "loading") return <div className="flex justify-center items-center h-64 text-slate-400">Starting quiz...</div>;
  if (error) return <div className="text-center text-red-400 py-12">{error}</div>;
  if (!session || !currentQuestion) return null;

  const progress = ((currentIdx) / session.total_questions) * 100;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">Question {currentIdx + 1} of {session.total_questions}</span>
        <span className="text-slate-400 text-sm font-mono">{currentQuestion.points} pts</span>
      </div>
      <div className="w-full bg-surface-700 rounded-full h-1.5 mb-8">
        <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            currentQuestion.difficulty === "easy" ? "bg-green-500/10 text-green-400" :
            currentQuestion.difficulty === "medium" ? "bg-yellow-500/10 text-yellow-400" :
            "bg-red-500/10 text-red-400"
          }`}>
            {currentQuestion.difficulty}
          </span>
          <span className="text-xs text-slate-500 font-mono">{currentQuestion.type.replace("_", " ")}</span>
        </div>

        <QuestionRenderer
          question={currentQuestion}
          selectedAnswer={answer}
          onAnswer={setAnswer}
          disabled={step === "feedback"}
        />

        {step === "feedback" && feedback && (
          <div className={`mt-6 p-4 rounded-lg border ${feedback.is_correct ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
            <div className="flex items-center gap-2 font-medium mb-2">
              {feedback.is_correct
                ? <><CheckCircle className="w-5 h-5 text-green-400" /><span className="text-green-400">Correct! +{feedback.points_earned} pts</span></>
                : <><XCircle className="w-5 h-5 text-red-400" /><span className="text-red-400">Incorrect</span></>
              }
            </div>
            {!feedback.is_correct && (
              <p className="text-slate-300 text-sm mb-1">Answer: <span className="font-mono text-green-400">{feedback.correct_answer}</span></p>
            )}
            <p className="text-slate-400 text-sm">{feedback.explanation}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {step === "quiz" ? (
            <button onClick={handleSubmit} disabled={!answer.trim()} className="btn-primary">
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
