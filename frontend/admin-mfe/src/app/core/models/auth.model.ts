export type UserRole =
  | 'ADMINISTRATOR'
  | 'MARKETING_MANAGER'
  | 'DIGITAL_MARKETING'
  | 'DESIGNER'
  | 'TELECALLER'
  | 'BDM'
  | string;

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

