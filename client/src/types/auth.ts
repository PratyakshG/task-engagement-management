export type Role = "ADMIN" | "MANAGER" | "TEAM_MEMBER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
}
