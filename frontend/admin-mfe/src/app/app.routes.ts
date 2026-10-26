import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./features/users-roles/users-roles.component').then(
        (m) => m.UsersRolesComponent
      ),
    data: { title: 'Users & Roles Management' },
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./features/users-roles/users-roles.component').then(
        (m) => m.UsersRolesComponent
      ),
    data: { title: 'System Roles' },
  },
  {
    path: '**',
    redirectTo: 'users',
  },
];

