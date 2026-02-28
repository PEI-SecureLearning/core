export type CompliancePolicyResponse = {
    tenant: string;
    content_md: string;
    updated_at: string;
    updated_by?: string | null;
};

export type ComplianceImportResponse = {
    content_md: string;
};

export type QuizQuestion = {
    id: string;
    prompt: string;
    options: string[];
    answer_index: number;
    feedback: string;
};

export type QuizQuestionDraft = QuizQuestion & {
    local_id: string;
};

export type ComplianceQuizResponse = {
    tenant: string;
    question_bank: QuizQuestion[];
    question_count: number;
    passing_score: number;
    updated_at: string;
    updated_by?: string | null;
};

export type QuizSettings = {
    question_count: number;
    passing_score: number;
};
