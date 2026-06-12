import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AdminRoute from "./components/layout/AdminRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminTopicsPage from "./pages/admin/AdminTopicsPage";
import AdminQuestionsPage from "./pages/admin/AdminQuestionsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminSchedulePage from "./pages/admin/AdminSchedulePage";
import AdminAllQuestionsPage from "./pages/admin/AdminAllQuestionsPage";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-surface-900 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
              <Route path="/courses/:slug" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
              <Route path="/quiz/start" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
              <Route path="/quiz/results/:sessionId" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
              <Route path="/admin/courses" element={<AdminRoute><AdminCoursesPage /></AdminRoute>} />
              <Route path="/admin/courses/:courseId/topics" element={<AdminRoute><AdminTopicsPage /></AdminRoute>} />
              <Route path="/admin/topics/:topicId/questions" element={<AdminRoute><AdminQuestionsPage /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
              <Route path="/admin/schedule" element={<AdminRoute><AdminSchedulePage /></AdminRoute>} />
              <Route path="/admin/questions/:status" element={<AdminRoute><AdminAllQuestionsPage /></AdminRoute>} />
            </Routes>
          </main>
          <footer className="border-t border-surface-700 bg-surface-800 py-4 px-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} All rights reserved —{" "}
            <a
              href="https://josepaulotimbang.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              josepaulotimbang.com
            </a>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
