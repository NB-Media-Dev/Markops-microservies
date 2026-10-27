import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'users-roles',
    pathMatch: 'full',
  },
  {
    path: 'users-roles',
    loadComponent: () =>
      import('./features/users-roles/users-roles.component').then(
        (m) => m.UsersRolesComponent
      ),
    data: { title: 'Users & Roles Management' },
  },
  { path: 'users', redirectTo: 'users-roles', pathMatch: 'full' },
  { path: 'roles', redirectTo: 'users-roles', pathMatch: 'full' },
  {
    path: '**',
    redirectTo: 'users-roles',
  },
];
