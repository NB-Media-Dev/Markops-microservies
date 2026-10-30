export type UserRole =
  | 'ADMINISTRATOR'
  | 'MARKETING_MANAGER'
  | 'DIGITAL_MARKETING'
  | 'DESIGNER'
  | 'TELECALLER'
  | 'BDM';

export interface UserPermission {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  isActive: boolean;
  lastLoginAt?: string;
}
