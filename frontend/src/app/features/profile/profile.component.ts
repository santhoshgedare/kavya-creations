import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { OrderListItem, OrderStatus } from '../../core/models/order.model';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, MatChipsModule, MatProgressBarModule,
    ImageUploadComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  saving = signal(false);
  uploadingAvatar = signal(false);
  editMode = signal(false);
  orders = signal<OrderListItem[]>([]);
  ordersLoading = signal(true);
  readonly OrderStatus = OrderStatus;

  @ViewChild('avatarUpload') avatarUploadRef!: ImageUploadComponent;

  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phoneNumber: ['', [Validators.pattern(/^[+]?[\d\s\-()]{7,15}$/)]],
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber ?? '',
      });
    }
    this.orderService.getMyOrders().subscribe({
      next: (r) => { this.orders.set(r.items); this.ordersLoading.set(false); },
      error: () => this.ordersLoading.set(false),
    });
  }

  toggleEditMode(): void {
    this.editMode.update(v => !v);
    if (!this.editMode()) {
      const user = this.authService.currentUser();
      if (user) {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber ?? '',
        });
      }
    }
  }

  uploadAvatar(): void {
    const files = this.avatarUploadRef?.getPendingFiles() ?? [];
    if (!files.length) return;
    this.uploadingAvatar.set(true);
    this.productService.uploadImages(files).subscribe({
      next: (urls) => {
        const newUrl = urls[0];
        const user = this.authService.currentUser()!;
        this.authService.updateProfile(user.firstName, user.lastName, newUrl, user.phoneNumber).subscribe({
          next: () => {
            this.uploadingAvatar.set(false);
            this.snackBar.open('Profile photo updated!', 'Close', { duration: 2000 });
          },
          error: () => {
            this.uploadingAvatar.set(false);
            this.snackBar.open('Failed to update photo', 'Close', { duration: 3000 });
          },
        });
      },
      error: () => {
        this.uploadingAvatar.set(false);
        this.snackBar.open('Upload failed', 'Close', { duration: 3000 });
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.profileForm.value;
    const currentImageUrl = this.authService.currentUser()?.profileImageUrl;
    this.authService.updateProfile(v.firstName!, v.lastName!, currentImageUrl, v.phoneNumber || undefined).subscribe({
      next: () => {
        this.saving.set(false);
        this.editMode.set(false);
        this.snackBar.open('Profile updated!', 'Close', { duration: 2000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 });
      },
    });
  }

  getStatusLabel(status: OrderStatus): string {
    return OrderStatus[status] ?? 'Unknown';
  }
}
