// 1. A peça pequena (Header)
export interface CustomHeader {
  id?: number; // Opcional no frontend ao criar
  name: string;
  value: string;
}

// 2. A receita para criar (sem ID)
export interface SendingProfileCreate {
  name: string;
  smtp_host: string;
  smtp_port: number;
  username: string;
  password: string;
  from_fname: string;
  from_lname: string;
  from_email: string;
  custom_headers?: { name: string; value: string }[];
}

// 3. O produto final que vem da BD (com ID)
export interface SendingProfile extends SendingProfileCreate {
  id: number;
  realm_name?: string;
  custom_headers?: (CustomHeader & { id: number })[];
}

// 4. Subset returned by GET /sending-profiles (list endpoint)
//    Matches backend SendingProfileDisplayInfo — no password/username exposed
export interface SendingProfileDisplayInfo {
  readonly id: number;
  readonly name: string;
  readonly from_fname: string;
  readonly from_lname: string;
  readonly from_email: string;
  readonly smtp_host: string;
  readonly smtp_port: number;
}
