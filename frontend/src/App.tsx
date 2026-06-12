import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-surface-900">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
