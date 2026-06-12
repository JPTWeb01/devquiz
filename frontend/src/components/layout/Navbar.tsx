import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Code2, LogOut, Menu, Settings, User, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated, isGuest } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <nav className="border-b border-surface-700 bg-surface-800 px-4 sm:px-6 py-4 relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-slate-100 font-semibold text-lg">
          <Code2 className="w-6 h-6 text-brand-500" />
          DevQuiz
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          {isAuthenticated && isGuest ? (
            <>
              <Link to="/courses" className="text-slate-300 hover:text-slate-100 text-sm transition-colors">
                Courses
              </Link>
              <span className="text-xs px-2 py-0.5 rounded-full border border-surface-600 bg-surface-700 text-slate-400">
                Guest
              </span>
              <Link to="/register" className="btn-primary text-sm">
                Sign Up to Save Progress
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-slate-400 hover:text-red-400 text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Exit
              </button>
            </>
          ) : isAuthenticated ? (
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
                <span className="max-w-[120px] truncate">{user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-slate-400 hover:text-red-400 text-sm transition-colors"
              >
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

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-surface-700 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-surface-800 border-b border-surface-700 z-50 px-4 py-2 space-y-1 shadow-xl">
          {isAuthenticated && isGuest ? (
            <>
              <div className="flex items-center gap-2 text-slate-400 text-sm px-2 py-2 border-b border-surface-700 mb-1">
                <User className="w-4 h-4 shrink-0" />
                <span>Guest Mode</span>
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full border border-surface-600 bg-surface-700">Guest</span>
              </div>
              <Link
                to="/courses"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-slate-300 hover:text-slate-100 text-sm px-2 py-2.5 rounded-lg hover:bg-surface-700 transition-colors"
              >
                Courses
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="block btn-primary text-sm text-center mt-1"
              >
                Sign Up to Save Progress
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm w-full px-2 py-2.5 rounded-lg hover:bg-surface-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Exit Guest Mode
              </button>
            </>
          ) : isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-slate-400 text-sm px-2 py-2 border-b border-surface-700 mb-1">
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">{user?.name || user?.email}</span>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-slate-300 hover:text-slate-100 text-sm px-2 py-2.5 rounded-lg hover:bg-surface-700 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/courses"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-slate-300 hover:text-slate-100 text-sm px-2 py-2.5 rounded-lg hover:bg-surface-700 transition-colors"
              >
                Courses
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm px-2 py-2.5 rounded-lg hover:bg-surface-700 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm w-full px-2 py-2.5 rounded-lg hover:bg-surface-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block text-slate-300 hover:text-slate-100 text-sm px-2 py-2.5 rounded-lg hover:bg-surface-700 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="block btn-primary text-sm text-center mt-1"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
