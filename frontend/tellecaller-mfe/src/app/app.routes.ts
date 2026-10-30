import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { TELECALLING_ROUTES } from './telecalling.routes';

// Standalone mode only (http://localhost:4205). No shell, no /login: auth belongs to the main container.
export const routes: Routes = [
  { path: '', canActivate: [authGuard], children: TELECALLING_ROUTES },
  { path: '**', redirectTo: 'telecalling' },
];
