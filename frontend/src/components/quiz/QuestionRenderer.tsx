import Editor from "@monaco-editor/react";
import type { Question } from "../../lib/types";

interface Props {
  question: Question;
  selectedAnswer: string;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export default function QuestionRenderer({ question, selectedAnswer, onAnswer, disabled }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-slate-100 text-lg leading-relaxed">{question.question_text}</p>

      {question.code_block && (
        <div className="rounded-lg overflow-hidden border border-surface-600">
          <Editor
            height="200px"
            defaultLanguage="javascript"
            value={question.code_block}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </div>
      )}

      {question.type === "mcq" && question.options && (
        <div className="space-y-3">
          {question.options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => !disabled && onAnswer(opt.label)}
              disabled={disabled}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-150 ${
                selectedAnswer === opt.label
                  ? "border-brand-500 bg-brand-500/10 text-brand-400"
                  : "border-surface-600 bg-surface-700 text-slate-200 hover:border-surface-500 hover:bg-surface-600"
              } disabled:cursor-not-allowed`}
            >
              <span className="font-mono text-slate-400 mr-3">{opt.label}.</span>
              {opt.text}
            </button>
          ))}
        </div>
      )}

      {(question.type === "predict_output" || question.type === "fill_blank") && (
        <input
          type="text"
          className="input font-mono"
          placeholder={question.type === "predict_output" ? "Enter the output..." : "Fill in the blank..."}
          value={selectedAnswer}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={disabled}
        />
      )}

      {(question.type === "debugging" || question.type === "code_writing") && (
        <div className="rounded-lg overflow-hidden border border-surface-600">
          <Editor
            height="160px"
            defaultLanguage="javascript"
            value={selectedAnswer}
            onChange={(val) => onAnswer(val || "")}
            theme="vs-dark"
            options={{
              readOnly: disabled,
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      )}
    </div>
  );
}
