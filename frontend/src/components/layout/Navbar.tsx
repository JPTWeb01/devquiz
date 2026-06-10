import { Link, useNavigate } from "react-router-dom";
import { Code2, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="border-b border-surface-700 bg-surface-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-slate-100 font-semibold text-lg">
          <Code2 className="w-6 h-6 text-brand-500" />
          DevQuiz
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-slate-300 hover:text-slate-100 text-sm transition-colors">
                Dashboard
              </Link>
              <Link to="/courses" className="text-slate-300 hover:text-slate-100 text-sm transition-colors">
                Courses
              </Link>
              {user?.role === "admin" && (
                <Link to="/admin" className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-sm transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <User className="w-4 h-4" />
                {user?.name || user?.email}
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1 text-slate-400 hover:text-red-400 text-sm transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-slate-100 text-sm transition-colors">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
