import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { OrderService } from '../../../core/services/order.service';
import { OrderListItem, OrderStatus, PaymentStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    RouterLink, CurrencyPipe, DatePipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, MatPaginatorModule,
  ],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.scss',
})
export class MyOrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  orders = signal<OrderListItem[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 10;
  readonly OrderStatus = OrderStatus;
  readonly PaymentStatus = PaymentStatus;

  private readonly statusLabels: Record<number, string> = {
    1: 'Pending', 2: 'Confirmed', 3: 'Processing',
    4: 'Shipped', 5: 'Delivered', 6: 'Cancelled', 7: 'Refunded',
  };
  private readonly statusColors: Record<number, string> = {
    1: 'default', 2: 'primary', 3: 'primary',
    4: 'accent', 5: 'default', 6: 'warn', 7: 'warn',
  };

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService.getMyOrders(this.page(), this.pageSize).subscribe({
      next: (r) => { this.orders.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void { this.page.set(event.pageIndex + 1); this.loadOrders(); }

  getStatusLabel(status: OrderStatus): string { return this.statusLabels[status] ?? 'Unknown'; }
  getStatusColor(status: OrderStatus): string { return this.statusColors[status] ?? 'default'; }
  getPaymentLabel(status: PaymentStatus): string { return PaymentStatus[status] ?? 'Unknown'; }
}
