import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { OrderListItem, OrderStatus } from '../../core/models/order.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatChipsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  saving = signal(false);
  orders = signal<OrderListItem[]>([]);
  ordersLoading = signal(true);
  readonly OrderStatus = OrderStatus;

  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    profileImageUrl: [''],
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl ?? '',
      });
    }
    this.orderService.getMyOrders().subscribe({
      next: (r) => { this.orders.set(r.items); this.ordersLoading.set(false); },
      error: () => this.ordersLoading.set(false),
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.profileForm.value;
    this.authService.updateProfile(v.firstName!, v.lastName!, v.profileImageUrl || undefined).subscribe({
      next: () => { this.saving.set(false); this.snackBar.open('Profile updated!', 'Close', { duration: 2000 }); },
      error: () => { this.saving.set(false); this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 }); },
    });
  }

  getStatusLabel(status: OrderStatus): string {
    return OrderStatus[status] ?? 'Unknown';
  }
}
