import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Order, OrderListItem, CreateOrderRequest, PagedResult } from '../models/order.model';
import { environment } from '../../../environments/environment';

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCategories: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  createOrder(request: CreateOrderRequest): Observable<string> {
    return this.http.post<string>(this.baseUrl, request);
  }

  getMyOrders(page = 1, pageSize = 10): Observable<PagedResult<OrderListItem>> {
    return this.http.get<PagedResult<OrderListItem>>(`${this.baseUrl}/mine?page=${page}&pageSize=${pageSize}`);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  // Admin
  getAllOrders(page = 1, pageSize = 20): Observable<PagedResult<OrderListItem>> {
    return this.http.get<PagedResult<OrderListItem>>(`${this.baseUrl}?page=${page}&pageSize=${pageSize}`);
  }

  updateOrderStatus(id: string, status: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/status`, status);
  }

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.baseUrl}/stats`);
  }
}
