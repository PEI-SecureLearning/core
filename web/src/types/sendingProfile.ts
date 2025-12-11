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
  // Nota: O backend aceita lista vazia, aqui pomos opcional para facilitar
  custom_headers?: { name: string; value: string }[];
}

// 3. O produto final que vem da BD (com ID) - ERA ISTO QUE FALTAVA!
export interface SendingProfile extends SendingProfileCreate {
  id: number;
  realm_name?: string;
  // Quando vem da BD, os headers já trazem estrutura completa
  custom_headers?: (CustomHeader & { id: number })[];
}
