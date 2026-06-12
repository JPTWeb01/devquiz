import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Calendar, Code2, LayoutDashboard, Menu, Users, X } from "lucide-react";

const NAV = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Courses", href: "/admin/courses", icon: BookOpen, exact: false },
  { label: "Users", href: "/admin/users", icon: Users, exact: false },
  { label: "Schedule", href: "/admin/schedule", icon: Calendar, exact: false },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 px-2">
          Admin Panel
        </p>
        <nav className="space-y-1">
          {NAV.map(({ label, href, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                to={href}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-brand-600/20 text-blue-400 font-medium"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface-700"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-surface-700 shrink-0">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors rounded-lg hover:bg-surface-700"
        >
          <Code2 className="w-4 h-4" />
          Back to App
        </Link>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex" style={{ minHeight: "calc(100vh - 65px)" }}>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-56 shrink-0 bg-surface-800 border-r border-surface-700 flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {sidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-surface-800 border-r border-surface-700 flex flex-col lg:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700 shrink-0">
            <span className="text-slate-300 font-semibold text-sm">Admin Panel</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-surface-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <SidebarContent pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-surface-700 bg-surface-800 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-surface-700 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-slate-300 font-medium text-sm">Admin</span>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
