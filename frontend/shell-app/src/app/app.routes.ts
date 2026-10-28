import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('@login/login/login.component').then((m) => m.LoginComponent),
    data: { title: 'MarkOps Login' },
  },
  {
    path: 'designer',
    loadComponent: () =>
      import('@designer/features/designer/designer-dashboard.component').then(
        (m) => m.DesignerDashboardComponent
      ),
    data: { title: 'MarkOps Designer Studio' },
  },
  {
    path: 'designer/tasks/:id',
    loadComponent: () =>
      import('@designer/features/designer/task-detail/task-detail.component').then(
        (m) => m.TaskDetailComponent
      ),
    data: { title: 'Task Details' },
  },
  {
    path: 'users-roles',
    loadComponent: () =>
      import('@admin/features/users-roles/users-roles.component').then(
        (m) => m.UsersRolesComponent
      ),
    data: { title: 'Users & Roles Management' },
  },
  // Canonical redirects to avoid repeating component loader code:
  { path: 'admin', redirectTo: 'users-roles', pathMatch: 'full' },
  { path: 'admin/users', redirectTo: 'users-roles', pathMatch: 'full' },
  { path: 'users', redirectTo: 'users-roles', pathMatch: 'full' },
  { path: 'roles', redirectTo: 'users-roles', pathMatch: 'full' },
  {
    path: '**',
    redirectTo: 'login',
  },
];
