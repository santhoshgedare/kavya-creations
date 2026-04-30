import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { VariantService } from '../../../core/services/variant.service';
import { Product, ProductListItem, ProductStatus, CategoryAttribute, ProductVariant } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private readonly variantService = inject(VariantService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(true);
  product = signal<Product | null>(null);
  relatedProducts = signal<ProductListItem[]>([]);
  selectedImage = signal<string>('');
  quantity = signal(1);
  variants = signal<ProductVariant[]>([]);
  categoryAttributes = signal<CategoryAttribute[]>([]);
  selectedAttributeValues = signal<Record<string, string>>({});
  readonly ProductStatus = ProductStatus;

  // Pre-computed lookup: attributeValueId -> attributeId for O(1) lookups
  private readonly valueToAttributeMap = computed(() => {
    const map = new Map<string, string>();
    for (const ca of this.categoryAttributes()) {
      for (const val of ca.values) {
        map.set(val.id, ca.attributeId);
      }
    }
    return map;
  });

  selectedVariant = computed(() => {
    const attrs = this.selectedAttributeValues();
    const vs = this.variants();
    if (vs.length === 0 || Object.keys(attrs).length === 0) return null;
    const lookup = this.valueToAttributeMap();
    return vs.find(v =>
      v.attributeValues.every(av => {
        const attrId = lookup.get(av.attributeValueId);
        return attrId ? attrs[attrId] === av.attributeValueId : true;
      })
    ) ?? null;
  });

  effectivePrice = computed(() => {
    const variant = this.selectedVariant();
    if (variant) return variant.price;
    const p = this.product();
    return p?.discountPrice ?? p?.effectivePrice ?? 0;
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['slug']) this.loadProduct(params['slug']);
    });
  }

  loadProduct(slug: string): void {
    this.loading.set(true);
    this.productService.getProductBySlug(slug).subscribe({
      next: (p) => {
        this.product.set(p);
        const primary = p.images.find(i => i.isPrimary)?.url ?? p.images[0]?.url ?? '';
        this.selectedImage.set(primary);
        this.loading.set(false);
        this.loadRelated(p.categoryId, p.id);
        this.loadVariants(p.id);
        this.loadAttributes(p.categoryId);
      },
      error: () => this.loading.set(false),
    });
  }

  loadRelated(categoryId: string, excludeId: string): void {
    this.productService.getProducts({ category: categoryId, pageSize: 4 }).subscribe({
      next: (r) => this.relatedProducts.set(r.items.filter(p => p.id !== excludeId)),
    });
  }

  loadVariants(productId: string): void {
    this.variantService.getProductVariants(productId).subscribe({
      next: (vs) => this.variants.set(vs),
    });
  }

  loadAttributes(categoryId: string): void {
    this.variantService.getCategoryAttributes(categoryId).subscribe({
      next: (attrs) => this.categoryAttributes.set(attrs),
    });
  }

  onAttributeSelect(attributeId: string, valueId: string): void {
    this.selectedAttributeValues.update(prev => ({ ...prev, [attributeId]: valueId }));
  }

  adjustQuantity(delta: number): void {
    const variant = this.selectedVariant();
    const max = variant?.stockQuantity ?? this.product()?.stockQuantity ?? 1;
    this.quantity.update(q => Math.max(1, Math.min(max, q + delta)));
  }

  addToCart(): void {
    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Please login to add items to cart', 'Close', { duration: 3000 });
      return;
    }
    const p = this.product();
    if (!p) return;
    const variant = this.selectedVariant();
    this.cartService.addToCart(p.id, this.quantity(), variant?.id).subscribe({
      next: () => this.snackBar.open('Added to cart!', 'Close', { duration: 2000 }),
      error: () => this.snackBar.open('Failed to add to cart', 'Close', { duration: 3000 }),
    });
  }
}
