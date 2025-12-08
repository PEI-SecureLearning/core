export type UserRecord = {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
};

export type BulkUser = {
  username: string;
  name: string;
  email: string;
  role: string;
  groups?: string[];
  status?: string;
};
