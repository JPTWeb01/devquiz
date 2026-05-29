export type Role = "student" | "admin";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "mcq" | "predict_output" | "debugging" | "fill_blank" | "code_writing";
export type SessionStatus = "in_progress" | "completed" | "abandoned";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
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

export interface QuizResult {
  session_id: string;
  score: number;
  total_points: number;
  percentage: number;
  status: SessionStatus;
  completed_at: string | null;
  items: {
    question_id: string;
    user_answer: string | null;
    is_correct: boolean | null;
    time_spent: number | null;
  }[];
}
