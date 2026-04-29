import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly snackBar = inject(MatSnackBar);

  submitting = signal(false);

  shippingForm = this.fb.group({
    street: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['India', Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.cartService.loadCart().subscribe();
  }

  placeOrder(): void {
    if (this.shippingForm.invalid) { this.shippingForm.markAllAsTouched(); return; }
    this.submitting.set(true);
    const v = this.shippingForm.value;
    this.orderService.createOrder({
      street: v.street!,
      city: v.city!,
      state: v.state!,
      postalCode: v.postalCode!,
      country: v.country!,
      notes: v.notes || undefined,
    }).subscribe({
      next: (orderId) => {
        this.cartService.clearLocal();
        this.snackBar.open('Order placed successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/orders', orderId]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open(err?.error?.message || 'Failed to place order', 'Close', { duration: 3000 });
      },
    });
  }
}
