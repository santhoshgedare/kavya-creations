import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoryAttribute, ProductAttribute, ProductVariant } from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VariantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}`;

  getProductVariants(productId: string): Observable<ProductVariant[]> {
    return this.http.get<ProductVariant[]>(`${this.baseUrl}/variants/by-product/${productId}`);
  }

  getVariantById(variantId: string): Observable<ProductVariant> {
    return this.http.get<ProductVariant>(`${this.baseUrl}/variants/${variantId}`);
  }

  getCategoryAttributes(categoryId: string): Observable<CategoryAttribute[]> {
    return this.http.get<CategoryAttribute[]>(`${this.baseUrl}/attributes/by-category/${categoryId}`);
  }

  getAllAttributes(): Observable<ProductAttribute[]> {
    return this.http.get<ProductAttribute[]>(`${this.baseUrl}/attributes`);
  }

  createAttribute(data: { name: string; displayName: string; inputType: string }): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/attributes`, data);
  }

  updateAttribute(id: string, data: { displayName: string; inputType: string }): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/attributes/${id}`, data);
  }

  deleteAttribute(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/attributes/${id}`);
  }

  addAttributeValue(attributeId: string, data: { value: string; displayValue: string; displayOrder: number }): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/attributes/${attributeId}/values`, data);
  }

  updateAttributeValue(valueId: string, data: { value: string; displayValue: string; displayOrder: number }): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/attributes/values/${valueId}`, data);
  }

  deleteAttributeValue(valueId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/attributes/values/${valueId}`);
  }

  mapAttributeToCategory(data: { categoryId: string; attributeId: string; displayOrder: number; isRequired: boolean }): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/attributes/category-mappings`, data);
  }

  removeAttributeFromCategory(mappingId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/attributes/category-mappings/${mappingId}`);
  }

  generateVariants(data: { productId: string; attributeValueIds: string[]; defaultPrice: number; defaultStock: number }): Observable<string[]> {
    return this.http.post<string[]>(`${this.baseUrl}/variants/generate`, data);
  }

  createVariant(data: { productId: string; sku: string; price: number; stockQuantity: number; attributeValueIds: string[] }): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/variants`, data);
  }

  updateVariant(variantId: string, data: { price: number; stockQuantity: number }): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/variants/${variantId}`, data);
  }

  bulkUpdateVariants(variants: { id: string; price: number; stockQuantity: number }[]): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/variants/bulk`, { variants });
  }

  deleteVariant(variantId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/variants/${variantId}`);
  }
}
