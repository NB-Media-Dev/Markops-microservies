import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SYSTEM_ROLES_METADATA } from '../models/user-management.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly showPassword = signal<boolean>(false);
  readonly loginSubmitted = signal<boolean>(false);
  readonly demoMessage = signal<string | null>(null);
  readonly demoError = signal<string | null>(null);
  readonly rolesList = SYSTEM_ROLES_METADATA;

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    rememberMe: [false],
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  async onSubmit(): Promise<void> {
  this.loginSubmitted.set(true);
  this.demoMessage.set(null);
  this.demoError.set(null);

  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  const email = String(this.loginForm.value.email || '')
    .toLowerCase()
    .trim();

  const password = String(this.loginForm.value.password || '');


  const success = await this.authService.login({ email, password });

  if (success) {
    this.demoMessage.set('Login successfully!');
    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'MARKOPS_NAVIGATE',
          route: 'dashboard'
        }, '*');
      }
    } catch {}
  }

}
}



