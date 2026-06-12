export type Role = "student" | "editor" | "admin";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "mcq" | "predict_output" | "debugging" | "fill_blank" | "code_writing";
export type SessionStatus = "in_progress" | "completed" | "abandoned";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  is_master: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  language: string;
  icon: string | null;
  order: number;
  topics: Topic[];
}

export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  language: string;
  icon: string | null;
  description: string | null;
  topic_count: number;
  is_published: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  question_text: string;
  code_block: string | null;
  options: { label: string; text: string }[] | null;
  points: number;
}

export interface QuizSession {
  session_id: string;
  questions: Question[];
  total_questions: number;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  points_earned: number;
}

export interface AdminStats {
  total_courses: number;
  total_topics: number;
  total_questions: number;
  published_questions: number;
  total_users: number;
  total_sessions: number;
}

export interface AdminQuestion {
  id: string;
  topic_id: string;
  type: QuestionType;
  difficulty: Difficulty;
  question_text: string;
  code_block: string | null;
  options: { label: string; text: string }[] | null;
  correct_answer: string;
  explanation: string;
  tags: string | null;
  points: number;
  is_published: boolean;
}

export interface AdminQuestionAll extends AdminQuestion {
  published_at: string | null;
  created_at: string | null;
  topic_title: string;
  course_title: string;
}

export interface UserStats {
  quizzes_taken: number;
  best_score: number;
  topics_completed: number;
}

export interface QuizResult {
  session_id: string;
  score: number;
  total_points: number;
  percentage: number;
  status: SessionStatus;
  completed_at: string | null;
  started_at: string | null;
  time_taken_seconds: number | null;
  items: {
    question_id: string;
    user_answer: string | null;
    is_correct: boolean | null;
    time_spent: number | null;
  }[];
}
