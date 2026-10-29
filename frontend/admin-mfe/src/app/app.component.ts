import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({  
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly platformId = inject(PLATFORM_ID);
  readonly authService = inject(AuthService);
  title = 'MarkOps Administration';

  isEmbedded(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    }
    return false;
  }

  handleLogout(): void {
    this.authService.logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}
