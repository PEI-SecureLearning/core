export interface UserRecord {
    id?: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    isOrgManager?: boolean;
    is_org_manager?: boolean;
}

export interface Group {
    id?: string;
    name?: string;
}

export interface BulkUser {
    username: string;
    name: string;
    email: string;
    role: string;
    groups: string[];
    status: string;
}

export type CreateUserField = "name" | "email" | "username" | "role" | "group" | null;
