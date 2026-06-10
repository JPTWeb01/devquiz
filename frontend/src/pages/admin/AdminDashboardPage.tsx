import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle, FileQuestion, Layers, PlayCircle, Users } from "lucide-react";
import api from "../../lib/api";
import type { AdminStats } from "../../lib/types";
import AdminLayout from "../../components/layout/AdminLayout";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AdminStats>("/api/admin/stats")
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "Courses",
      value: stats?.total_courses,
      icon: BookOpen,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      link: "/admin/courses",
    },
    {
      label: "Topics",
      value: stats?.total_topics,
      icon: Layers,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      link: "/admin/courses",
    },
    {
      label: "Total Questions",
      value: stats?.total_questions,
      icon: FileQuestion,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      link: "/admin/courses",
    },
    {
      label: "Published Questions",
      value: stats?.published_questions,
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-400/10",
      link: "/admin/courses",
    },
    {
      label: "Users",
      value: stats?.total_users,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      link: "/admin/users",
    },
    {
      label: "Quizzes Completed",
      value: stats?.total_sessions,
      icon: PlayCircle,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      link: "/admin/users",
    },
  ];

  const publishRate =
    stats && stats.total_questions > 0
      ? Math.round((stats.published_questions / stats.total_questions) * 100)
      : 0;

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Overview</h1>
          <p className="text-slate-400 mt-1 text-sm">Platform stats at a glance</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, bg, link }) => (
            <Link
              key={label}
              to={link}
              className="card hover:border-slate-600 transition-all duration-150 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{label}</p>
                  <p className="text-3xl font-bold text-slate-100 mt-1">
                    {loading ? (
                      <span className="inline-block w-10 h-7 bg-surface-700 rounded animate-pulse" />
                    ) : (
                      value ?? 0
                    )}
                  </p>
                </div>
                <div className={`${bg} p-2.5 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Publish rate */}
        {stats && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-slate-100 font-medium">Question Publish Rate</p>
                <p className="text-slate-500 text-sm mt-0.5">
                  {stats.published_questions} of {stats.total_questions} questions are live
                </p>
              </div>
              <span className="text-2xl font-bold text-slate-100">{publishRate}%</span>
            </div>
            <div className="w-full bg-surface-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${publishRate}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-slate-100 font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/admin/courses"
              className="flex items-center gap-3 p-4 bg-surface-700 hover:bg-surface-600 rounded-lg transition-colors"
            >
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-100 font-medium text-sm">Manage Courses</p>
                <p className="text-slate-500 text-xs">Add, edit or delete courses</p>
              </div>
            </Link>
            <Link
              to="/courses"
              className="flex items-center gap-3 p-4 bg-surface-700 hover:bg-surface-600 rounded-lg transition-colors"
            >
              <div className="bg-green-500/10 p-2 rounded-lg">
                <PlayCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-100 font-medium text-sm">Preview as Student</p>
                <p className="text-slate-500 text-xs">See how students see the app</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
