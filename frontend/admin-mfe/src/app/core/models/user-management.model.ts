import { UserRole } from './auth.model';

export interface ManagedUser {
  id: string;
  email: string;
  name?: string;
  fullName: string;
  role: UserRole | string;
  roleName?: string;
  department: string;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  role: UserRole | string;
  department?: string;
  password?: string;
  isActive?: boolean;
  avatarUrl?: string;
  avatarDataUrl?: string;
}

export interface UpdateUserRequest {
  id: string;
  email?: string;
  fullName?: string;
  role?: UserRole | string;
  department?: string;
  password?: string;
  isActive?: boolean;
  avatarUrl?: string;
  avatarDataUrl?: string;
}

export interface SystemRoleMetadata {
  role: UserRole;
  title: string;
  description: string;
  badgeClass: string;
  icon: string;
}

export const SYSTEM_ROLES_METADATA: SystemRoleMetadata[] = [
  {
    role: 'ADMINISTRATOR',
    title: 'Administrator',
    description: 'Complete system-wide administrative control, settings, user governance and audit tracking.',
    badgeClass: 'badge-admin',
    icon: 'admin_panel_settings',
  },
  {
    role: 'MARKETING_MANAGER',
    title: 'Marketing Manager',
    description: 'High-level campaign allocation, operational targets setting, conversion and performance oversight.',
    badgeClass: 'badge-manager',
    icon: 'insights',
  },
  {
    role: 'DIGITAL_MARKETING',
    title: 'Digital Marketing',
    description: 'Meta ad campaigns management, creative links, budget allocations and lead source monitoring.',
    badgeClass: 'badge-marketing',
    icon: 'campaign',
  },
  {
    role: 'DESIGNER',
    title: 'Designer',
    description: 'Design tasks execution, creative revisions, banner deliverables, asset uploads and creative collaboration.',
    badgeClass: 'badge-designer',
    icon: 'palette',
  },
  {
    role: 'TELECALLER',
    title: 'Telecaller',
    description: 'Lead engagement, call attempts logging, qualification workflows and follow-up schedules.',
    badgeClass: 'badge-telecaller',
    icon: 'phone_in_talk',
  },
  {
    role: 'BDM',
    title: 'Business Development Manager',
    description: 'Package Works governance, client transactions, creative task commissioning and approvals.',
    badgeClass: 'badge-bdm',
    icon: 'business_center',
  },
];

