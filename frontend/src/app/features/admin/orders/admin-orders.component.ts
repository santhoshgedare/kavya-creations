import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { OrderListItem, OrderStatus, PaymentStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatPaginatorModule, MatChipsModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly snackBar = inject(MatSnackBar);

  orders = signal<OrderListItem[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  readonly displayedColumns = ['orderNumber', 'date', 'items', 'total', 'paymentStatus', 'status', 'actions'];
  readonly OrderStatus = OrderStatus;
  readonly PaymentStatus = PaymentStatus;
  readonly orderStatuses = [
    { value: 1, label: 'Pending' }, { value: 2, label: 'Confirmed' }, { value: 3, label: 'Processing' },
    { value: 4, label: 'Shipped' }, { value: 5, label: 'Delivered' }, { value: 6, label: 'Cancelled' }, { value: 7, label: 'Refunded' },
  ];

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService.getAllOrders(this.page(), this.pageSize).subscribe({
      next: (r) => { this.orders.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(order: OrderListItem, status: number): void {
    this.orderService.updateOrderStatus(order.id, status).subscribe({
      next: () => { this.snackBar.open('Status updated', 'Close', { duration: 2000 }); this.loadOrders(); },
      error: () => this.snackBar.open('Failed to update status', 'Close', { duration: 3000 }),
    });
  }

  getStatusLabel(status: OrderStatus): string {
    return this.orderStatuses.find(s => s.value === status)?.label ?? 'Unknown';
  }

  getPaymentLabel(status: PaymentStatus): string {
    return PaymentStatus[status] ?? 'Unknown';
  }

  onPageChange(event: PageEvent): void { this.page.set(event.pageIndex + 1); this.loadOrders(); }
}
