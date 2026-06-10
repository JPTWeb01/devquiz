import { Link, useLocation } from "react-router-dom";
import { BookOpen, Calendar, Code2, LayoutDashboard, Users } from "lucide-react";

const NAV = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Courses", href: "/admin/courses", icon: BookOpen, exact: false },
  { label: "Users", href: "/admin/users", icon: Users, exact: false },
  { label: "Schedule", href: "/admin/schedule", icon: Calendar, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex" style={{ minHeight: "calc(100vh - 65px)" }}>
      <aside className="w-56 shrink-0 bg-surface-800 border-r border-surface-700 flex flex-col">
        <div className="p-4">
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

        <div className="mt-auto p-4 border-t border-surface-700">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors rounded-lg hover:bg-surface-700"
          >
            <Code2 className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
