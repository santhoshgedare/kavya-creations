import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly _currentUser = signal<User | null>(this.loadUserFromStorage());
  private readonly _accessToken = signal<string | null>(localStorage.getItem('access_token'));
  private readonly _requiresPhoneCompletion = signal<boolean>(
    localStorage.getItem('requires_phone_completion') === 'true'
  );

  readonly currentUser = this._currentUser.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly requiresPhoneCompletion = this._requiresPhoneCompletion.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly isAdmin = computed(() => this._currentUser()?.roles?.includes('Admin') ?? false);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  googleSignIn(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/google-signin`, { idToken }).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (!accessToken || !refreshToken) {
      this.logout();
      return throwError(() => new Error('No tokens'));
    }
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, { accessToken, refreshToken }).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(email: string, token: string, newPassword: string, confirmPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reset-password`, { email, token, newPassword, confirmPassword });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile`).pipe(
      tap(user => this._currentUser.set(user))
    );
  }

  updateProfile(firstName: string, lastName: string, profileImageUrl?: string, phoneNumber?: string): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/profile`, { firstName, lastName, profileImageUrl, phoneNumber }).pipe(
      tap(user => {
        this._currentUser.set(user);
        localStorage.setItem('current_user', JSON.stringify(user));
        // Clear phone completion flag once profile is updated with a phone number
        if (phoneNumber) {
          this._requiresPhoneCompletion.set(false);
          localStorage.removeItem('requires_phone_completion');
        }
      })
    );
  }

  private handleAuthResponse(response: AuthResponse): void {
    this._currentUser.set(response.user);
    this._accessToken.set(response.accessToken);
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    localStorage.setItem('current_user', JSON.stringify(response.user));
    if (response.requiresPhoneCompletion) {
      this._requiresPhoneCompletion.set(true);
      localStorage.setItem('requires_phone_completion', 'true');
    } else {
      this._requiresPhoneCompletion.set(false);
      localStorage.removeItem('requires_phone_completion');
    }
  }

  private clearAuthData(): void {
    this._currentUser.set(null);
    this._accessToken.set(null);
    this._requiresPhoneCompletion.set(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('requires_phone_completion');
  }

  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem('current_user');
    return userJson ? JSON.parse(userJson) : null;
  }
}
