import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Code2 } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import type { AuthResponse } from "../lib/types";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>("/api/auth/login", { email, password });
      login(data.access_token, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Code2 className="w-8 h-8 text-brand-500" />
          <span className="text-2xl font-bold text-slate-100">DevQuiz</span>
        </div>

        <h1 className="text-xl font-semibold text-slate-100 mb-6 text-center">Welcome back</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          No account?{" "}
          <Link to="/register" className="text-brand-500 hover:text-brand-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
