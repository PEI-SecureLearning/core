export type UserRecord = {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  is_org_manager?: boolean;
  isOrgManager?: boolean;
};

export type BulkUser = {
  username: string;
  name: string;
  email: string;
  role: string;
  groups?: string[];
  status?: string;
};
