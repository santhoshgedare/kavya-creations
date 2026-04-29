import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
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
  private readonly productService = inject(ProductService);

  totalOrders = signal(0);
  totalProducts = signal(0);
  recentOrders = signal<OrderListItem[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.orderService.getAllOrders(1, 5).subscribe({
      next: (r) => { this.totalOrders.set(r.totalCount); this.recentOrders.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.productService.getProducts({ pageSize: 1 }).subscribe({
      next: (r) => this.totalProducts.set(r.totalCount),
    });
  }
}
