import { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Shield, Trash2, X } from "lucide-react";
import api from "../../lib/api";
import type { Role } from "../../lib/types";
import { useAuth } from "../../contexts/AuthContext";
import AdminLayout from "../../components/layout/AdminLayout";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  is_active: boolean;
  is_master: boolean;
  created_at: string | null;
}

const ROLE_STYLES: Record<Role, string> = {
  admin:   "bg-purple-500/10 text-purple-400 border-purple-500/30",
  editor:  "bg-blue-500/10 text-blue-400 border-blue-500/30",
  student: "bg-slate-700 text-slate-400 border-surface-600",
};

const BLANK_CREATE = { name: "", email: "", password: "", role: "student" as Role };

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {message}
    </div>
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const isMaster = currentUser?.is_master === true;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(BLANK_CREATE);
  const [showPw, setShowPw] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit modal
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "student" as Role });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const load = () =>
    api.get<AdminUser[]>("/api/admin/users")
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // ── Create ────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSaving(true);
    setCreateError("");
    try {
      await api.post("/api/admin/users", createForm);
      setCreateForm(BLANK_CREATE);
      setShowCreateForm(false);
      load();
      showToast("User created successfully");
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || "Failed to create user");
    } finally {
      setCreateSaving(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────
  const openEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditForm({ name: user.name || "", email: user.email, role: user.role });
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditSaving(true);
    setEditError("");
    try {
      await api.put(`/api/admin/users/${editUser.id}`, editForm);
      setEditUser(null);
      load();
      showToast("User updated successfully");
    } catch (err: any) {
      setEditError(err.response?.data?.detail || "Failed to update user");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Delete "${user.name || user.email}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/users/${user.id}`);
      load();
      showToast(`"${user.name || user.email}" deleted`);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to delete user", "error");
    }
  };

  // ── Toggle active ─────────────────────────────────────────────
  const handleToggleActive = async (user: AdminUser) => {
    try {
      await api.put(`/api/admin/users/${user.id}`, { is_active: !user.is_active });
      load();
      showToast(user.is_active ? "User deactivated" : "User activated");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to update user", "error");
    }
  };

  const roleCounts = {
    admin:   users.filter(u => u.role === "admin").length,
    editor:  users.filter(u => u.role === "editor").length,
    student: users.filter(u => u.role === "student").length,
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        {toast && <Toast {...toast} />}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Users</h1>
            <p className="text-slate-400 text-sm mt-1">{users.length} total users</p>
          </div>
          <button
            onClick={() => { setShowCreateForm(true); setCreateError(""); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New User
          </button>
        </div>

        {/* Role summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {(["admin", "editor", "student"] as Role[]).map(role => (
            <div key={role} className={`border rounded-xl p-4 text-center ${ROLE_STYLES[role]}`}>
              <p className="text-2xl font-bold">{roleCounts[role]}</p>
              <p className="text-sm mt-0.5 capitalize">{role}s</p>
            </div>
          ))}
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-100 font-semibold text-lg">New User</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <input className="input" required value={createForm.name}
                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
                  <input className="input" type="email" required value={createForm.email}
                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <input className="input pr-10" type={showPw ? "text" : "password"} required minLength={8}
                      value={createForm.password}
                      onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Role</label>
                  <select className="input" value={createForm.role}
                    onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as Role }))}>
                    <option value="student">Student</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {createError && <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{createError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary" disabled={createSaving}>
                  {createSaving ? "Creating..." : "Create User"}
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Edit User Modal */}
        {editUser && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
            <div className="bg-surface-800 border border-surface-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-slate-100 font-semibold text-lg">Edit User</h2>
                <button onClick={() => setEditUser(null)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <input className="input" value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
                  <input className="input" type="email" required value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["student", "editor", "admin"] as Role[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, role: r }))}
                        className={`py-2.5 rounded-lg border text-sm font-medium transition-all capitalize ${
                          editForm.role === r
                            ? ROLE_STYLES[r]
                            : "text-slate-400 border-surface-600 hover:border-slate-500 hover:text-slate-200"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                {editError && <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{editError}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1" disabled={editSaving}>
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => setEditUser(null)} className="btn-ghost">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Role legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-slate-500 flex-wrap">
          <span className="font-medium text-slate-400">Permissions:</span>
          <span><span className="text-purple-400 font-medium">Admin</span> — full access including user management</span>
          <span><span className="text-blue-400 font-medium">Editor</span> — manage content (courses, topics, questions)</span>
          <span><span className="text-slate-400 font-medium">Student</span> — take quizzes only</span>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="card h-16 animate-pulse bg-surface-700" />)}
          </div>
        ) : (
          <div className="card overflow-hidden p-0 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-surface-700">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">User</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-slate-100 font-medium">{user.name || "—"}</p>
                        {user.is_master && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                            <Shield className="w-3 h-3" /> Master
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ROLE_STYLES[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          user.is_active
                            ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                        }`}
                      >
                        {user.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit: always show for own account if master; hide for master if not master */}
                        {(!user.is_master || isMaster) && (
                          <button
                            onClick={() => openEdit(user)}
                            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500/60 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}
                        {/* Delete: never for master admin */}
                        {!user.is_master && (
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {/* Placeholder for master row to keep consistent height */}
                        {user.is_master && !isMaster && (
                          <span className="text-xs text-slate-600 italic px-3 py-1.5">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="text-slate-500 text-center py-12">No users found.</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
