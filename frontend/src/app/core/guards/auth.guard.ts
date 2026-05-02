import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }
  // Redirect external-login users who haven't supplied a phone number yet
  if (authService.requiresPhoneCompletion()) {
    router.navigate(['/auth/complete-profile']);
    return false;
  }
  return true;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated() && authService.isAdmin()) return true;
  router.navigate(['/']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isAuthenticated()) return true;
  router.navigate(['/']);
  return false;
};

/** Guard for the /auth/complete-profile page — only accessible when phone is required */
export const phoneRequiredGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated() && authService.requiresPhoneCompletion()) return true;
  router.navigate(['/']);
  return false;
};

