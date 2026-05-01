import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.scss',
})
export class CompleteProfileComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  saving = signal(false);

  form = this.fb.group({
    phoneNumber: ['', [
      Validators.required,
      Validators.pattern(/^[+]?[\d\s\-()]{7,15}$/),
    ]],
  });

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const user = this.authService.currentUser()!;
    this.authService
      .updateProfile(user.firstName, user.lastName, user.profileImageUrl, this.form.value.phoneNumber!)
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Phone number saved! Welcome!', 'Close', { duration: 2500 });
          this.router.navigate(['/']);
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to save phone number. Please try again.', 'Close', { duration: 3000 });
        },
      });
  }
}
