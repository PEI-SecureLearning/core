export type ComplianceDoc = {
    version: string;
    title: string;
    updated_at: string;
    word_count: number;
    content: string;
};

export type QuizQuestion = {
    id: string;
    prompt: string;
    options: string[];
};

export type QuizPayload = {
    version: string;
    required_score: number;
    question_count: number;
    cooldown_seconds: number;
    questions: QuizQuestion[];
};

export type SubmitResponse = {
    passed: boolean;
    score: number;
    required_score: number;
    cooldown_seconds_remaining: number;
    feedback: { id: string; correct: boolean; feedback: string }[];
};

export type StatusResponse = {
    required_version: string;
    accepted: boolean;
    accepted_at: string | null;
    score: number | null;
};

export type Step = "read" | "quiz" | "confirm" | "done";

export const STEPS: Step[] = ["read", "quiz", "confirm", "done"];

export function formatDate(iso?: string | null) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString();
}
