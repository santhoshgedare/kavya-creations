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
import { MatDialog } from '@angular/material/dialog';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { VariantService } from '../../../core/services/variant.service';
import { Product, ProductListItem, ProductStatus, CategoryAttribute, ProductVariant } from '../../../core/models/product.model';
import { LightboxComponent, LightboxData } from '../../../shared/components/lightbox/lightbox.component';

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
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  product = signal<Product | null>(null);
  relatedProducts = signal<ProductListItem[]>([]);
  selectedImage = signal<string>('');
  selectedImageIndex = signal<number>(0);
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
        const primaryIdx = p.images.findIndex(i => i.isPrimary);
        const idx = primaryIdx >= 0 ? primaryIdx : 0;
        this.selectedImageIndex.set(idx);
        this.selectedImage.set(p.images[idx]?.url ?? '');
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

  selectImage(url: string, index: number): void {
    this.selectedImage.set(url);
    this.selectedImageIndex.set(index);
  }

  openLightbox(): void {
    const p = this.product();
    if (!p || p.images.length === 0) return;
    const data: LightboxData = {
      images: p.images.map(img => ({ url: img.url, altText: img.altText ?? p.name })),
      initialIndex: this.selectedImageIndex(),
    };
    this.dialog.open(LightboxComponent, {
      data,
      panelClass: 'lightbox-dialog-panel',
      maxWidth: '92vw',
      maxHeight: '94vh',
      autoFocus: false,
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder.jpg';
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
