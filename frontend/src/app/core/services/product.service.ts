import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product, ProductListItem, ProductFilters, Category, PagedResult } from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}`;

  getProducts(filters: ProductFilters = {}): Observable<PagedResult<ProductListItem>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page);
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.minPrice != null) params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice != null) params = params.set('maxPrice', filters.maxPrice);
    if (filters.isFeatured != null) params = params.set('isFeatured', filters.isFeatured);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
    return this.http.get<PagedResult<ProductListItem>>(`${this.baseUrl}/products`, { params });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}`);
  }

  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/slug/${slug}`);
  }

  getFeaturedProducts(): Observable<PagedResult<ProductListItem>> {
    return this.getProducts({ isFeatured: true, pageSize: 8 });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  // Admin only
  createProduct(data: Partial<Product> & { imageUrls: string[] }): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/products`, data);
  }

  updateProduct(id: string, data: Partial<Product>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/products/${id}`, data);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }

  createCategory(data: Partial<Category>): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/categories`, data);
  }

  updateCategory(id: string, data: Partial<Category>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/categories/${id}`, data);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  uploadImages(files: File[]): Observable<string[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file, file.name));
    return this.http.post<string[]>(`${this.baseUrl}/images/upload`, formData);
  }

  deleteImage(path: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/images`, { params: { path } });
  }
}
