import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly notifService = inject(NotificationService);
  private readonly router = inject(Router)

  readonly isNotificationFlyoutOpen = signal<boolean>(false);
  readonly notifFlyoutFilter = signal<'ALL' | 'UNREAD'>('ALL');
  readonly isProfileModalOpen = signal<boolean>(false);
  readonly isEmbedded = typeof window !== 'undefined' && window.parent && window.parent !== window;

  // Active User & Roles
  readonly activeRole = computed<string>(() => {
    return this.authService.currentUser()?.role || 'DESIGNER';
  });

  readonly roleDisplayLabel = computed<string>(() => {
    const user = this.authService.currentUser();
    const role = (user?.roleName || user?.role || this.activeRole()).toUpperCase();
    if (role === 'ADMIN' || role === 'ADMINISTRATOR') return 'Administrator';
    if (role === 'DESIGNER') return 'Designer';
    if (role === 'BDM') return 'BDM';
    if (role.includes('MARKET')) return 'Digital Marketing';
    if (role.includes('TELE')) return 'Telecaller';
    return role.replace(/_/g, ' ');
  });

  readonly roleAction = computed(() => {
    return {
      link: '/package-works',
      label: 'Package Works',
      icon: 'inventory_2',
    };
  });

  readonly userInitials = computed<string>(() => {
    const user = this.authService.currentUser();
    if (!user?.fullName) return 'PR';
    const parts = user.fullName.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (user.fullName.slice(0, 2) || 'PR').toUpperCase();
  });

  ngOnInit(): void {
    if (!this.authService.currentUser()) {
      const defaultUser = {
        id: 'usr_designer_01',
        email: 'preethi@markops.io',
        fullName: 'preethi',
        role: 'DESIGNER' as const,
        department: 'Designer',
        isActive: true,
      };
      (this.authService as any)._currentUser?.set(defaultUser);
    }
  }

  toggleNotificationFlyout(): void {
    this.isNotificationFlyoutOpen.update((v) => !v);
  }

  closeNotificationFlyout(): void {
    this.isNotificationFlyoutOpen.set(false);
  }

  setFlyoutFilter(filter: 'ALL' | 'UNREAD'): void {
    this.notifFlyoutFilter.set(filter);
  }

  openProfileModal(): void {
    this.isProfileModalOpen.set(true);
  }

  closeProfileModal(): void {
    this.isProfileModalOpen.set(false);
  }

  getAvatarUrl(url?: string): string {
    return url || '';
  }

  cleanTitle(text?: string): string {
    return text || '';
  }

  onToastClick(toast: any): void {
    if (toast.route) {
      this.router.navigate([toast.route]);
    }
  }

   onToastClose(event: Event): void {
    event.stopPropagation();
    this.notifService.activeToast.set(null);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
