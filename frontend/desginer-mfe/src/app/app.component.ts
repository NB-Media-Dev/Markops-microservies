import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { TaskManagementService } from './core/services/task-management.service';

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
  readonly taskService = inject(TaskManagementService);
  private readonly router = inject(Router);

  readonly isMicroserviceConnected = signal<boolean>(true);
  readonly activeUser = computed(() => this.authService.currentUser());

  ngOnInit(): void {
    // Ensure default designer session if not logged in
    if (!this.authService.currentUser()) {
      const demoDesigner = {
        id: 'usr_designer_01',
        email: 'designer@markops.io',
        fullName: 'Creative Designer',
        role: 'DESIGNER' as const,
        department: 'Creative Design Studio',
        isActive: true,
      };
      (this.authService as any)._currentUser?.set(demoDesigner);
      (this.authService as any)._accessToken?.set('mo_jwt_designer_microservice');
      try {
        localStorage.setItem('markops_user', JSON.stringify(demoDesigner));
        localStorage.setItem('markops_token', 'mo_jwt_designer_microservice');
      } catch {}
    }
  }

  switchRole(role: 'DESIGNER' | 'ADMINISTRATOR' | 'BDM'): void {
    let mockUser;
    if (role === 'DESIGNER') {
      mockUser = {
        id: 'usr_designer_01',
        email: 'designer@markops.io',
        fullName: 'Creative Designer',
        role: 'DESIGNER' as const,
        department: 'Creative Design Studio',
        isActive: true,
      };
    } else if (role === 'BDM') {
      mockUser = {
        id: 'usr_bdm_01',
        email: 'bdm@markops.io',
        fullName: 'Business Development Manager',
        role: 'BDM' as const,
        department: 'Sales & BD',
        isActive: true,
      };
    } else {
      mockUser = {
        id: '1',
        email: 'admin@markops.io',
        fullName: 'System Administrator',
        role: 'ADMINISTRATOR' as const,
        department: 'Operations',
        isActive: true,
      };
    }
    (this.authService as any)._currentUser?.set(mockUser);
    try {
      localStorage.setItem('markops_user', JSON.stringify(mockUser));
    } catch {}
    this.taskService.loadTasks();
    this.taskService.loadDesignerMetrics();
  }

  dismissToast(): void {
    this.notifService.activeToast.set(null);
  }
}
