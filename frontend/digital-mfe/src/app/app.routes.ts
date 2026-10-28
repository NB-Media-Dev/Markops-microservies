import { Route, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

function createRoute(
  path: string,
  title: string,
  icon: string,
  loader: () => Promise<any>,
  roles?: string[]
): Route {
  const route: Route = {
    path,
    loadComponent: loader,
    data: { title, icon, ...(roles ? { roles } : {}) },
  };
  if (roles) {
    route.canActivate = [roleGuard];
  }
  return route;
}

const loadCampaigns = () => import('./features/campaigns/campaigns.component').then((m) => m.CampaignsComponent);
const loadAds = () => import('./features/ads/ads.component').then((m) => m.AdsComponent);
const loadLeads = () => import('./features/leads/leads.component').then((m) => m.LeadsComponent);
const loadDownloads = () => import('./features/downloads/downloads.component').then((m) => m.DownloadsComponent);
const loadNotifications = () => import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent);

export const routes: Routes = [
  
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'campaigns',
        pathMatch: 'full',
      },
      createRoute('campaigns', 'Campaigns', 'campaign', loadCampaigns, ['ADMINISTRATOR', 'ADMIN', 'DIGITAL_MARKETING', 'DIGITAL MARKETING', 'MARKETING_MANAGER']),
      createRoute('ads', 'Ads', 'ads_click', loadAds, ['ADMINISTRATOR', 'ADMIN', 'DIGITAL_MARKETING', 'DIGITAL MARKETING']),
      createRoute('ad-metrics', 'Ad Metrics', 'query_stats', loadAds, ['ADMINISTRATOR', 'ADMIN', 'DIGITAL_MARKETING', 'DIGITAL MARKETING']),
      createRoute('leads', 'Leads', 'contacts', loadLeads, ['ADMINISTRATOR', 'ADMIN', 'DIGITAL_MARKETING', 'DIGITAL MARKETING']),
      createRoute('lead-source', 'Lead Source', 'share', loadLeads, ['ADMINISTRATOR', 'ADMIN', 'DIGITAL_MARKETING', 'DIGITAL MARKETING']),
      createRoute('downloads', 'Downloads', 'download', loadDownloads),
      createRoute('notifications', 'Notifications', 'notifications', loadNotifications),
    ],
  },
  {
    path: '**',
    redirectTo: 'campaigns',
  },
];
