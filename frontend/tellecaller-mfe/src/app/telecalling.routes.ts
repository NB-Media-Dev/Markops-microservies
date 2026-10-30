import { Route, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { roleGuard } from './core/guards/role.guard';
import { authInterceptor } from './core/interceptors/auth.interceptor';

const ROLES = ['ADMINISTRATOR', 'TELECALLER'];
const load = () =>
  import('./features/telecalling/telecalling.component').then((m) => m.TelecallingComponent);

function page(path: string, title: string, icon: string): Route {
  return { path, loadComponent: load, canActivate: [roleGuard], data: { title, icon, roles: ROLES } };
}

/**
 * Exposed to the main container as `tellecaller-mfe/routes` (see federation.config.js).
 * The parent route carries its own HttpClient + auth interceptor so the module works
 * no matter how the main container configured HTTP.
 */
export const TELECALLING_ROUTES: Routes = [
  {
    path: '',
    providers: [provideHttpClient(withInterceptors([authInterceptor]))],
    children: [
      { path: '', redirectTo: 'telecalling', pathMatch: 'full' },
      page('telecalling', 'Telecalling', 'phone_in_talk'),
      page('calls', 'Calls', 'phone_in_talk'),
      page('follow-ups', 'Follow-ups', 'event_repeat'),
      page('qualification', 'Qualification', 'verified'),
      page('outcomes', 'Outcomes', 'done_all'),
    ],
  },
];
