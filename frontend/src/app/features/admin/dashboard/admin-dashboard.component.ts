import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { OrderListItem } from '../../../core/models/order.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  totalOrders = signal(0);
  totalProducts = signal(0);
  totalRevenue = signal(0);
  totalCategories = signal(0);
  recentOrders = signal<OrderListItem[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.orderService.getAdminStats().subscribe({
      next: (stats) => {
        this.totalOrders.set(stats.totalOrders);
        this.totalProducts.set(stats.totalProducts);
        this.totalRevenue.set(stats.totalRevenue);
        this.totalCategories.set(stats.totalCategories);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.orderService.getAllOrders(1, 5).subscribe({
      next: (r) => this.recentOrders.set(r.items),
    });
  }
}
