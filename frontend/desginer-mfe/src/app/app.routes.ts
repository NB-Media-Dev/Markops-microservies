import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'designer-tasks',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    redirectTo: 'designer-tasks',
    pathMatch: 'full',
  },
  {
    path: 'designer-tasks',
    loadComponent: () =>
      import('./features/designer/designer-dashboard.component').then((m) => m.DesignerDashboardComponent),
    data: { title: 'Designer Workspace', icon: 'palette' },
  },
  {
    path: 'designer-tasks/:id',
    loadComponent: () =>
      import('./features/designer/task-detail/task-detail.component').then((m) => m.TaskDetailComponent),
    data: { title: 'Task Details', icon: 'task_alt' },
  },
  {
    path: 'tasks',
    redirectTo: 'designer-tasks',
    pathMatch: 'full',
  },
  {
    path: 'tasks/:id',
    redirectTo: 'designer-tasks/:id',
  },
  {
    path: 'submissions',
    loadComponent: () =>
      import('./features/designer/designer-dashboard.component').then((m) => m.DesignerDashboardComponent),
    data: { title: 'Design Submissions', icon: 'upload_file' },
  },
  {
    path: 'revisions',
    loadComponent: () =>
      import('./features/designer/designer-dashboard.component').then((m) => m.DesignerDashboardComponent),
    data: { title: 'Design Revisions', icon: 'edit_note' },
  },
  {
    path: 'designers',
    loadComponent: () =>
      import('./features/designer/designer-dashboard.component').then((m) => m.DesignerDashboardComponent),
    data: { title: 'Designers Directory', icon: 'palette' },
  },
  {
    path: '**',
    redirectTo: 'designer-tasks',
  },
];
