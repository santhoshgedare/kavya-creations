import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { CurrencyPipe } from '@angular/common';
import { VariantService } from '../../../core/services/variant.service';
import { ProductService } from '../../../core/services/product.service';
import { ProductVariant, ProductAttribute, ProductListItem } from '../../../core/models/product.model';

@Component({
  selector: 'app-admin-variants',
  standalone: true,
  imports: [
    ReactiveFormsModule, CurrencyPipe,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatChipsModule
  ],
  templateUrl: './admin-variants.component.html',
  styleUrl: './admin-variants.component.scss',
})
export class AdminVariantsComponent implements OnInit {
  private readonly variantService = inject(VariantService);
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  loading = signal(false);
  products = signal<ProductListItem[]>([]);
  attributes = signal<ProductAttribute[]>([]);
  variants = signal<ProductVariant[]>([]);
  selectedProductId = signal<string | null>(null);

  variantColumns = ['sku', 'price', 'stock', 'available', 'attributes', 'actions'];

  generateForm = this.fb.group({
    productId: ['', Validators.required],
    attributeValueIds: [[] as string[], Validators.required],
    defaultPrice: [0, [Validators.required, Validators.min(1)]],
    defaultStock: [0, [Validators.required, Validators.min(0)]],
  });

  editForm = this.fb.group({
    price: [0, [Validators.required, Validators.min(0)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
  });

  editingVariantId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProducts();
    this.loadAttributes();
  }

  loadProducts(): void {
    this.productService.getProducts({ pageSize: 100 }).subscribe({
      next: (r) => this.products.set(r.items),
    });
  }

  loadAttributes(): void {
    this.variantService.getAllAttributes().subscribe({
      next: (attrs) => this.attributes.set(attrs),
    });
  }

  onProductSelect(productId: string): void {
    this.selectedProductId.set(productId);
    this.loadVariants(productId);
  }

  loadVariants(productId: string): void {
    this.loading.set(true);
    this.variantService.getProductVariants(productId).subscribe({
      next: (vs) => { this.variants.set(vs); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  generateVariants(): void {
    if (this.generateForm.invalid) return;
    const val = this.generateForm.value;
    this.variantService.generateVariants({
      productId: val.productId!,
      attributeValueIds: val.attributeValueIds ?? [],
      defaultPrice: val.defaultPrice!,
      defaultStock: val.defaultStock!,
    }).subscribe({
      next: (ids) => {
        this.snackBar.open(`Generated ${ids.length} variants`, 'Close', { duration: 3000 });
        this.loadVariants(val.productId!);
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to generate', 'Close', { duration: 3000 }),
    });
  }

  startEdit(variant: ProductVariant): void {
    this.editingVariantId.set(variant.id);
    this.editForm.patchValue({ price: variant.price, stockQuantity: variant.stockQuantity });
  }

  saveEdit(variantId: string): void {
    if (this.editForm.invalid) return;
    const val = this.editForm.value;
    this.variantService.updateVariant(variantId, { price: val.price!, stockQuantity: val.stockQuantity! }).subscribe({
      next: () => {
        this.snackBar.open('Updated', 'Close', { duration: 2000 });
        this.editingVariantId.set(null);
        if (this.selectedProductId()) this.loadVariants(this.selectedProductId()!);
      },
      error: () => this.snackBar.open('Failed to update', 'Close', { duration: 3000 }),
    });
  }

  cancelEdit(): void {
    this.editingVariantId.set(null);
  }

  deleteVariant(variantId: string): void {
    if (!confirm('Delete this variant?')) return;
    this.variantService.deleteVariant(variantId).subscribe({
      next: () => {
        this.snackBar.open('Deleted', 'Close', { duration: 2000 });
        if (this.selectedProductId()) this.loadVariants(this.selectedProductId()!);
      },
      error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 }),
    });
  }

  getAllValues(): { id: string; label: string }[] {
    return this.attributes().flatMap(a =>
      a.values.map(v => ({ id: v.id, label: `${a.displayName}: ${v.displayValue}` }))
    );
  }

  getVariantAttributeLabel(variant: ProductVariant): string {
    return variant.attributeValues.map(av => `${av.attributeName}: ${av.displayValue}`).join(', ');
  }
}
