import { Component, inject, signal, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly platformId = inject(PLATFORM_ID);

  loading = signal(false);
  hidePassword = signal(true);
  readonly googleClientId = environment.googleClientId;

  private static readonly GOOGLE_SDK_RETRY_DELAY_MS = 300;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.googleClientId) {
      this.initGoogleSignIn();
    }
  }

  private initGoogleSignIn(): void {
    const tryInit = () => {
      if (typeof google !== 'undefined' && google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: (response: any) => this.handleGoogleCredential(response),
        });
        google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'outline', size: 'large', width: 320, text: 'signin_with' }
        );
      } else {
        setTimeout(tryInit, LoginComponent.GOOGLE_SDK_RETRY_DELAY_MS);
      }
    };
    tryInit();
  }

  private handleGoogleCredential(response: any): void {
    this.loading.set(true);
    this.authService.googleSignIn(response.credential).subscribe({
      next: (authResponse) => {
        this.loading.set(false);
        if (authResponse.requiresPhoneCompletion) {
          this.router.navigate(['/auth/complete-profile']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err?.error?.message || 'Google sign-in failed. Please try again.', 'Close', { duration: 4000 });
      },
    });
  }

  submit(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.loginForm.value;
    this.authService.login({ email: v.email!, password: v.password! }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err?.error?.message || 'Login failed. Please check your credentials.', 'Close', { duration: 4000 });
      },
    });
  }
}
