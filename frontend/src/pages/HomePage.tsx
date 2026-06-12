import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle,
  ChevronRight,
  Code2,
  Layers,
  PlayCircle,
  Shield,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "";

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    title: "AI-Generated Questions",
    desc: "Paste any content or upload a PDF — AI instantly creates quiz questions tailored to the topic.",
  },
  {
    icon: Layers,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    title: "6 Question Types",
    desc: "Multiple Choice, Predict Output, Fill in the Blank, Debugging, Code Writing, and mixed modes.",
  },
  {
    icon: BarChart3,
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/20",
    title: "Progress Tracking",
    desc: "Track your best scores, quizzes taken, and topics completed across your entire journey.",
  },
  {
    icon: Calendar,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
    title: "Auto-Scheduling",
    desc: "Set a weekly schedule — fresh questions auto-generate every day at midnight, keeping you consistent.",
  },
  {
    icon: Shuffle,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
    title: "Randomized Options",
    desc: "MCQ choices shuffle every attempt so you learn the concept, not the position of the answer.",
  },
  {
    icon: Shield,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    title: "Multi-Role Access",
    desc: "Admin, Editor, and Student roles with fine-grained permissions for managing content and users.",
  },
];

const STEPS = [
  {
    number: "01",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    title: "Pick a Topic",
    desc: "Browse courses across JavaScript, Python, React, TypeScript, HTML & CSS, and AI Engineering.",
  },
  {
    number: "02",
    icon: PlayCircle,
    color: "text-green-400",
    bg: "bg-green-400/10",
    title: "Configure Your Quiz",
    desc: "Choose difficulty, question type, and count. Every session is customized to your needs.",
  },
  {
    number: "03",
    icon: BarChart3,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    title: "Review & Improve",
    desc: "See explanations for every answer, track your best scores, and keep coming back to level up.",
  },
];

const STACK = [
  { label: "FastAPI",          color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/20"  },
  { label: "Python 3.11",      color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20"   },
  { label: "React 18",         color: "text-cyan-400",   bg: "bg-cyan-400/10",   border: "border-cyan-400/20"   },
  { label: "TypeScript",       color: "text-blue-300",   bg: "bg-blue-300/10",   border: "border-blue-300/20"   },
  { label: "Tailwind CSS",     color: "text-teal-400",   bg: "bg-teal-400/10",   border: "border-teal-400/20"   },
  { label: "MySQL",            color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  { label: "SQLAlchemy",       color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20"    },
  { label: "Vite",             color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  { label: "Groq / Gemini AI", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  { label: "Render",           color: "text-slate-300",  bg: "bg-slate-300/10",  border: "border-slate-300/20"  },
  { label: "Hostinger",        color: "text-pink-400",   bg: "bg-pink-400/10",   border: "border-pink-400/20"   },
];

const DEMO_OPTIONS = [
  { label: "A", text: "[1, 2, 3]",   correct: false },
  { label: "B", text: "[2, 4, 6]",   correct: true  },
  { label: "C", text: "[1, 4, 9]",   correct: false },
  { label: "D", text: "undefined",   correct: false },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { isAuthenticated, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/guest`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      loginAsGuest(data.access_token, data.user);
      navigate("/courses");
    } catch {
      // silently fail — user can try again
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        {/* Glow blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-brand-600/20 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[100px]"
        />

        <div className="relative max-w-7xl mx-auto px-6 py-20 sm:py-28 lg:py-32">
          <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16">

            {/* Left — text */}
            <div className="flex-1 min-w-0">
              {/* Badge */}
              <div
                className="anim-fade-in inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 anim-pulse-ring"
                style={{ animationDelay: "0s" }}
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-xs font-medium text-brand-400 tracking-wide">Personal Learning &amp; Review Tool</span>
              </div>

              {/* Headline */}
              <h1
                className="anim-fade-in-up text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-5"
                style={{ animationDelay: "0.1s" }}
              >
                <span className="text-slate-100">Master Code.</span>
                <br />
                <span
                  className="anim-gradient bg-gradient-to-r from-blue-400 via-brand-400 to-cyan-400 bg-clip-text text-transparent"
                >
                  One Quiz at a Time.
                </span>
              </h1>

              {/* Subtext */}
              <p
                className="anim-fade-in-up text-slate-400 text-lg leading-relaxed mb-8 max-w-xl"
                style={{ animationDelay: "0.2s" }}
              >
                AI-generated quizzes across JavaScript, Python, React, TypeScript,
                HTML &amp; CSS, and AI Engineering. Built to sharpen your skills
                through daily practice.
              </p>

              {/* CTAs */}
              <div
                className="anim-fade-in-up flex flex-wrap items-center gap-3"
                style={{ animationDelay: "0.3s" }}
              >
                {isAuthenticated ? (
                  <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
                    Go to Dashboard <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
                      Get Started Free <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link to="/login" className="btn-ghost flex items-center gap-2 text-sm px-5 py-2.5">
                      Sign In
                    </Link>
                    <button
                      onClick={handleGuestLogin}
                      disabled={guestLoading}
                      className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg border border-surface-600 text-slate-300 hover:border-slate-400 hover:text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {guestLoading ? "Loading..." : "Try as Guest"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right — floating demo quiz card */}
            <div
              className="anim-fade-in anim-float flex-shrink-0 w-full lg:w-[380px]"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="card shadow-2xl shadow-black/40 border-surface-600">
                {/* Card header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-medium">
                    easy
                  </span>
                  <span className="text-xs text-slate-500 font-mono">predict output</span>
                  <span className="ml-auto text-xs text-slate-600 font-mono">10 pts</span>
                </div>

                <p className="text-slate-200 text-sm font-medium mb-3">
                  What will this code output?
                </p>

                {/* Code block */}
                <pre className="bg-surface-900 border border-surface-700 rounded-lg p-3 text-xs font-mono text-slate-300 mb-4 overflow-x-auto leading-relaxed">
                  <span className="text-blue-400">const</span>
                  {" arr = ["}
                  <span className="text-orange-400">1</span>
                  {", "}
                  <span className="text-orange-400">2</span>
                  {", "}
                  <span className="text-orange-400">3</span>
                  {"];\n"}
                  <span className="text-yellow-400">console</span>
                  {".log(arr."}
                  <span className="text-green-400">map</span>
                  {"(n => n * "}
                  <span className="text-orange-400">2</span>
                  {"));"}
                </pre>

                {/* Options */}
                <div className="space-y-2">
                  {DEMO_OPTIONS.map((opt) => (
                    <div
                      key={opt.label}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                        opt.correct
                          ? "border-green-500/40 bg-green-500/8 text-slate-100"
                          : "border-surface-600 text-slate-400"
                      }`}
                    >
                      <span className="font-mono text-xs text-slate-500 w-4 shrink-0">{opt.label}.</span>
                      <span className="font-mono">{opt.text}</span>
                      {opt.correct && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 ml-auto shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <div className="border-y border-surface-700 bg-surface-800/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-400">
            {[
              "5+ Programming Languages",
              "6 Question Types",
              "AI-Powered Generation",
              "Daily Auto-Scheduling",
              "Free to Use",
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="hidden sm:inline text-surface-600">·</span>}
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 sm:hidden" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-3">
            Everything you need to learn effectively
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            From AI-generated questions to daily scheduling — DevQuiz is built to make consistent practice effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className="anim-fade-in-up card hover:border-slate-500 transition-all duration-200 group"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className={`inline-flex p-2.5 rounded-lg ${f.bg} mb-4 border ${f.border}`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-slate-100 font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="bg-surface-800/40 border-y border-surface-700">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-3">
              How it works
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Three simple steps to sharpen your coding knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div
              aria-hidden
              className="hidden sm:block absolute top-8 left-1/4 right-1/4 h-px border-t border-dashed border-surface-600"
            />

            {STEPS.map((step, i) => (
              <div key={step.number} className="anim-fade-in-up relative flex flex-col items-center text-center" style={{ animationDelay: `${0.1 * i}s` }}>
                {/* Number badge */}
                <div className="relative mb-5">
                  <div className={`w-16 h-16 rounded-2xl ${step.bg} border border-surface-600 flex items-center justify-center`}>
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-bold font-mono text-slate-600 bg-surface-900 px-1.5 rounded">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-slate-100 font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20 sm:py-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-3">
            Built with modern tools
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            A full-stack application built from scratch with a modern, production-grade tech stack.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {STACK.map((tech, i) => (
            <span
              key={tech.label}
              className={`anim-fade-in-up relative overflow-hidden inline-flex items-center px-4 py-2 rounded-xl border text-sm font-medium ${tech.color} ${tech.bg} ${tech.border}`}
              style={{ animationDelay: `${0.04 * i}s` }}
            >
              <span className="anim-shimmer absolute inset-0 pointer-events-none" />
              {tech.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── PERSONAL NOTE ──────────────────────────────────────────────────── */}
      <section className="bg-surface-800/40 border-y border-surface-700">
        <div className="max-w-3xl mx-auto px-6 py-20 sm:py-24">
          <div className="card border-l-4 border-l-brand-500 border-surface-600">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-brand-500/10 border border-brand-500/20 shrink-0 mt-0.5">
                <Code2 className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h3 className="text-slate-100 font-semibold text-lg mb-3">
                  Built for personal use first
                </h3>
                <p className="text-slate-400 leading-relaxed mb-3">
                  DevQuiz started as a personal tool to help me review programming concepts,
                  prepare for technical interviews, and build a daily practice habit.
                  It grew into a full-featured platform with AI-powered question generation,
                  role-based access, and automated scheduling.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  While it's open to use, it's primarily designed as a{" "}
                  <span className="text-slate-200 font-medium">personal review companion and learning tool</span>
                  {" "}— the kind of project you build to solve your own problem, then share with others.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-brand-600/5 to-transparent"
        />
        <div className="relative max-w-3xl mx-auto px-6 py-24 sm:py-32 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-4">
            Ready to level up{" "}
            <span className="anim-gradient bg-gradient-to-r from-blue-400 via-brand-400 to-cyan-400 bg-clip-text text-transparent">
              your coding skills?
            </span>
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Start quizzing today — it's free and takes 30 seconds to sign up.
          </p>
          {isAuthenticated ? (
            <Link to="/courses" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base">
              Browse Courses <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <div className="flex flex-wrap justify-center items-center gap-3">
              <Link to="/register" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base">
                Create Free Account <ChevronRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-ghost inline-flex items-center gap-2 px-6 py-3 text-base">
                Sign In
              </Link>
              <button
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="inline-flex items-center gap-2 px-6 py-3 text-base rounded-lg border border-surface-600 text-slate-300 hover:border-slate-400 hover:text-slate-100 transition-colors disabled:opacity-50"
              >
                {guestLoading ? "Loading..." : "Try as Guest"}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
