import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ManagedUser, CreateUserRequest, UpdateUserRequest } from '../models/user-management.model';
import { safeFetch } from '../utils/api-url.utils';

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  rolesDistribution: Array<{ roleId: string; roleName: string; userCount: number }>;
}

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Live state signals populated 100% from MySQL Database
  private readonly _users = signal<ManagedUser[]>([]);
  private readonly _roles = signal<any[]>([]);
  private readonly _metrics = signal<AdminMetrics | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly users = computed(() => this._users());
  readonly roles = computed(() => this._roles());
  readonly metrics = computed(() => this._metrics());
  readonly isLoading = computed(() => this._isLoading());
  readonly error = computed(() => this._error());

  readonly totalUsersCount = computed(() => this._users().length);
  readonly activeUsersCount = computed(() => this._users().filter((u) => u.isActive).length);
  readonly inactiveUsersCount = computed(() => this._users().filter((u) => !u.isActive).length);

  constructor() {
    if (this.isBrowser) {
      setTimeout(() => {
        void this.loadUsersFromDatabase();
        void this.loadRolesFromDatabase();
        void this.loadMetricsFromDatabase();
      }, 0);
    }
  }

  /**
   * Fetches the complete list of users directly from MySQL database (auth_db.User)
   */
  async loadUsersFromDatabase(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const res = await safeFetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        const userList: ManagedUser[] = Array.isArray(data)
          ? data
          : data?.data && Array.isArray(data.data)
          ? data.data
          : [];

        // Normalize roles & fullNames
        const normalized = userList.map((u: any) => ({
          id: String(u.id),
          email: u.email,
          name: u.name || u.fullName,
          fullName: u.fullName || u.name,
          role: u.role || u.roleId,
          roleName: u.roleName || u.role || u.roleId,
          department: u.department || 'General Operations',
          isActive: Boolean(u.isActive),
          avatarUrl: u.avatarUrl || u.avatar_image || undefined,
          lastLoginAt: u.lastLoginAt || 'Recently',
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2026-01-01',
        }));

        this._users.set(normalized);
      } else {
        const errText = await res.text();
        console.error('[UserManagementService] Failed to fetch users:', res.status, errText);
        this._error.set(`Failed to fetch users from database (Status ${res.status})`);
      }
    } catch (err: any) {
      console.error('[UserManagementService] Network or DB connection error:', err);
      this._error.set(err?.message || 'Database connection error while loading users');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Fetches available system roles from MySQL database (auth_db.Role)
   */
  async loadRolesFromDatabase(): Promise<void> {
    try {
      const res = await safeFetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        const roleList = Array.isArray(data)
          ? data
          : data?.data && Array.isArray(data.data)
          ? data.data
          : [];
        this._roles.set(roleList);
      }
    } catch (err) {
      console.error('[UserManagementService] Failed to load roles from DB:', err);
    }
  }

  /**
   * Fetches live aggregate metrics from MySQL database
   */
  async loadMetricsFromDatabase(): Promise<void> {
    try {
      const res = await safeFetch('/api/users/metrics');
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data) {
          this._metrics.set(body.data);
        }
      }
    } catch (err) {
      console.error('[UserManagementService] Failed to fetch admin metrics:', err);
    }
  }

  /**
   * Persists a new user directly to MySQL database (auth_db.User)
   */
  async createUser(req: CreateUserRequest): Promise<ManagedUser> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const payload = {
        email: String(req.email || '').toLowerCase().trim(),
        fullName: String(req.fullName || '').trim(),
        name: String(req.fullName || '').trim(),
        role: req.role,
        roleId: req.role,
        department: String(req.department || 'General Operations').trim(),
        isActive: req.isActive !== undefined ? Boolean(req.isActive) : true,
        password: req.password,
        avatarUrl: req.avatarUrl,
        avatar_image: req.avatarUrl,
      };

      const res = await safeFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || `Failed to create user (Status ${res.status})`);
      }

      const createdUser: ManagedUser = {
        id: String(data.id || data.data?.id),
        email: data.email || data.data?.email || payload.email,
        fullName: data.fullName || data.data?.fullName || payload.fullName,
        role: data.role || data.data?.role || payload.role,
        department: data.department || data.data?.department || payload.department,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : payload.isActive,
        avatarUrl: data.avatarUrl || data.data?.avatarUrl || payload.avatarUrl,
        createdAt: new Date().toISOString().split('T')[0],
      };

      // Reload fresh list from DB
      await this.loadUsersFromDatabase();
      await this.loadMetricsFromDatabase();

      return createdUser;
    } catch (err: any) {
      this._error.set(err.message || 'Error creating user in database');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Updates an existing user record in MySQL database
   */
  async updateUser(userId: string, req: UpdateUserRequest): Promise<ManagedUser> {
    this._isLoading.set(true);

    try {
      const payload: any = {};
      if (req.fullName !== undefined) {
        payload.fullName = req.fullName.trim();
        payload.name = req.fullName.trim();
      }
      if (req.email !== undefined) payload.email = req.email.toLowerCase().trim();
      if (req.role !== undefined) {
        payload.role = req.role;
        payload.roleId = req.role;
      }
      if (req.department !== undefined) payload.department = req.department.trim();
      if (req.isActive !== undefined) payload.isActive = Boolean(req.isActive);
      if (req.password && req.password.trim().length > 0) payload.password = req.password;
      if (req.avatarUrl !== undefined) {
        payload.avatarUrl = req.avatarUrl;
        payload.avatar_image = req.avatarUrl;
      }

      const res = await safeFetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || `Failed to update user (Status ${res.status})`);
      }

      await this.loadUsersFromDatabase();
      await this.loadMetricsFromDatabase();

      return data.data || data;
    } catch (err: any) {
      this._error.set(err.message || 'Error updating user in database');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Toggles user active/inactive status directly in MySQL database
   */
  async toggleUserStatus(userId: string): Promise<boolean> {
    try {
      const res = await safeFetch(`/api/users/${userId}/toggle-status`, {
        method: 'PATCH',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to toggle status');
      }

      // Update state in local signal and refresh metrics
      this._users.update((list) =>
        list.map((u) => (u.id === userId ? { ...u, isActive: data.isActive } : u))
      );
      await this.loadMetricsFromDatabase();

      return data.isActive;
    } catch (err: any) {
      this._error.set(err.message || 'Failed to toggle status in database');
      throw err;
    }
  }

  /**
   * Deletes a user permanently from MySQL database
   */
  async deleteUser(userId: string): Promise<void> {
    this._isLoading.set(true);

    try {
      const res = await safeFetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to delete user (Status ${res.status})`);
      }

      this._users.update((list) => list.filter((u) => u.id !== userId));
      await this.loadMetricsFromDatabase();
    } catch (err: any) {
      this._error.set(err.message || 'Failed to delete user from database');
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }
}

