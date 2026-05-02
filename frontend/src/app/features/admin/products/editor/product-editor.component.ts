import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../../core/services/product.service';
import { VariantService } from '../../../../core/services/variant.service';
import {
  Product, Category, ProductStatus,
  CategoryAttribute, ProductVariant,
} from '../../../../core/models/product.model';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';

interface VariantRow {
  attributeValueIds: string[];
  displayLabel: string;
  sku: string;
  price: number;
  stock: number;
  existingVariantId?: string;
}

@Component({
  selector: 'app-product-editor',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatCheckboxModule, MatProgressSpinnerModule,
    MatStepperModule, MatChipsModule, MatTableModule,
    ImageUploadComponent,
  ],
  templateUrl: './product-editor.component.html',
  styleUrl: './product-editor.component.scss',
})
export class ProductEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly variantService = inject(VariantService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  @ViewChild('imageUpload') imageUploadRef!: ImageUploadComponent;

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  loadingAttrs = signal(false);
  productId = signal<string | null>(null);

  categories = signal<Category[]>([]);
  categoryAttributes = signal<CategoryAttribute[]>([]);
  generatedVariants = signal<VariantRow[]>([]);

  existingImageUrls: string[] = [];
  readonly ProductStatus = ProductStatus;

  private selectedValues = new Map<string, { id: string; value: string; displayValue: string }[]>();
  private lastLoadedCategoryId = '';
  private resolvedUrls: string[] = [];

  basicForm = this.fb.group({
    name: ['', Validators.required],
    slug: [''],
    shortDescription: [''],
    description: [''],
    price: [null as number | null, Validators.required],
    discountPrice: [null as number | null],
    stockQuantity: [0 as number, Validators.required],
    categoryId: ['' as string, Validators.required],
    status: [1 as number],
    isFeatured: [false],
  });

  ngOnInit(): void {
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.productId.set(id);
      this.loadProduct(id);
    }
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.basicForm.patchValue({
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription ?? '',
          description: product.description ?? '',
          price: product.price,
          discountPrice: product.discountPrice ?? null,
          stockQuantity: product.stockQuantity,
          categoryId: product.categoryId,
          status: product.status,
          isFeatured: product.isFeatured,
        });
        this.existingImageUrls = product.images.map(img => img.url);
        this.lastLoadedCategoryId = product.categoryId;
        this.loadingAttrs.set(true);
        this.variantService.getCategoryAttributes(product.categoryId).subscribe({
          next: (attrs) => { this.categoryAttributes.set(attrs); this.loadingAttrs.set(false); },
          error: () => this.loadingAttrs.set(false),
        });
        this.variantService.getProductVariants(id).subscribe({
          next: (variants) => {
            this.generatedVariants.set(variants.map(v => ({
              attributeValueIds: v.attributeValues.map(av => av.attributeValueId),
              displayLabel: v.attributeValues.map(av => `${av.attributeName}: ${av.displayValue}`).join(' / '),
              sku: v.sku,
              price: v.price,
              stock: v.stockQuantity,
              existingVariantId: v.id,
            })));
          },
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onStep1Next(): void {
    const categoryId = this.basicForm.value.categoryId;
    if (categoryId && categoryId !== this.lastLoadedCategoryId) {
      this.lastLoadedCategoryId = categoryId;
      this.loadingAttrs.set(true);
      this.selectedValues.clear();
      this.generatedVariants.set([]);
      this.variantService.getCategoryAttributes(categoryId).subscribe({
        next: (attrs) => { this.categoryAttributes.set(attrs); this.loadingAttrs.set(false); },
        error: () => this.loadingAttrs.set(false),
      });
    }
  }

  isValueSelected(valueId: string): boolean {
    for (const vals of this.selectedValues.values()) {
      if (vals.some(v => v.id === valueId)) return true;
    }
    return false;
  }

  toggleValue(attributeId: string, val: { id: string; value: string; displayValue: string }): void {
    const current = this.selectedValues.get(attributeId) ?? [];
    const idx = current.findIndex(v => v.id === val.id);
    if (idx >= 0) {
      this.selectedValues.set(attributeId, current.filter((_, i) => i !== idx));
    } else {
      this.selectedValues.set(attributeId, [...current, val]);
    }
    this.regenerateVariants();
  }

  private regenerateVariants(): void {
    const attrGroups: { attrId: string; attrName: string; vals: { id: string; value: string; displayValue: string }[] }[] = [];
    for (const attr of this.categoryAttributes()) {
      const vals = this.selectedValues.get(attr.attributeId) ?? [];
      if (vals.length > 0) {
        attrGroups.push({ attrId: attr.attributeId, attrName: attr.attributeDisplayName, vals });
      }
    }
    if (attrGroups.length === 0) { this.generatedVariants.set([]); return; }

    const combos = attrGroups.reduce<{ attrId: string; attrName: string; val: { id: string; value: string; displayValue: string } }[][]>(
      (prev, group) =>
        prev.length === 0
          ? group.vals.map(v => [{ attrId: group.attrId, attrName: group.attrName, val: v }])
          : prev.flatMap(p => group.vals.map(v => [...p, { attrId: group.attrId, attrName: group.attrName, val: v }])),
      []
    );

    const basePrice = this.basicForm.value.price ?? 0;
    const rows: VariantRow[] = combos.map(combo => {
      const displayLabel = combo.map(c => `${c.attrName}: ${c.val.displayValue}`).join(' / ');
      const skuSuffix = combo.map(c => c.val.value.toUpperCase().slice(0, 3)).join('-');
      const sku = `${(this.basicForm.value.slug || 'prod').toUpperCase().replace(/-/g, '')}-${skuSuffix}`;
      return { attributeValueIds: combo.map(c => c.val.id), displayLabel, sku, price: basePrice, stock: 0 };
    });
    this.generatedVariants.set(rows);
  }

  onStep2Next(): void {
    const basePrice = this.basicForm.value.price ?? 0;
    this.generatedVariants.update(rows => rows.map(r => ({ ...r, price: r.price || basePrice })));
  }

  updateVariantSku(index: number, sku: string): void {
    this.generatedVariants.update(rows => rows.map((r, i) => i === index ? { ...r, sku } : r));
  }

  updateVariantPrice(index: number, price: number): void {
    this.generatedVariants.update(rows => rows.map((r, i) => i === index ? { ...r, price } : r));
  }

  updateVariantStock(index: number, stock: number): void {
    this.generatedVariants.update(rows => rows.map((r, i) => i === index ? { ...r, stock } : r));
  }

  onUrlsChange(urls: string[]): void {
    this.resolvedUrls = urls;
  }

  save(): void {
    if (this.basicForm.invalid) {
      this.basicForm.markAllAsTouched();
      this.snackBar.open('Please complete all required fields in Basic Info', 'Close', { duration: 3000 });
      return;
    }
    const pendingFiles = this.imageUploadRef?.getPendingFiles() ?? [];
    if (pendingFiles.length > 0) {
      this.saving.set(true);
      this.productService.uploadImages(pendingFiles).subscribe({
        next: (uploadedUrls) => {
          const existingUrls = this.imageUploadRef.existingImages;
          const allUrls = [...existingUrls, ...uploadedUrls];
          this.saving.set(false);
          this.submitProduct({ ...this.basicForm.value, imageUrls: allUrls });
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Image upload failed. Please try again.', 'Close', { duration: 4000 });
        },
      });
    } else {
      this.submitProduct({ ...this.basicForm.value, imageUrls: this.resolvedUrls });
    }
  }

  private submitProduct(data: any): void {
    this.saving.set(true);
    const { variants, ...productData } = { variants: this.generatedVariants(), ...data };
    if (this.isEdit()) {
      this.productService.updateProduct(this.productId()!, productData).subscribe({
        next: () => {
          this.saveVariants(this.productId()!, variants ?? []);
          this.saving.set(false);
          this.snackBar.open('Product updated!', 'Close', { duration: 2000 });
          this.router.navigate(['/admin/products']);
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to update product', 'Close', { duration: 3000 });
        },
      });
    } else {
      this.productService.createProduct(productData).subscribe({
        next: (productId) => {
          if (variants?.length) this.saveVariants(productId, variants);
          this.saving.set(false);
          this.snackBar.open('Product created!', 'Close', { duration: 2000 });
          this.router.navigate(['/admin/products']);
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to create product', 'Close', { duration: 3000 });
        },
      });
    }
  }

  private saveVariants(productId: string, variants: VariantRow[]): void {
    for (const v of variants) {
      if (v.existingVariantId) {
        this.variantService.updateVariant(v.existingVariantId, { price: v.price, stockQuantity: v.stock }).subscribe({
          error: () => this.snackBar.open(`Failed to update variant "${v.displayLabel}"`, 'Close', { duration: 3000 }),
        });
      } else {
        this.variantService.createVariant({
          productId,
          sku: v.sku,
          price: v.price,
          stockQuantity: v.stock,
          attributeValueIds: v.attributeValueIds,
        }).subscribe({
          error: () => this.snackBar.open(`Failed to save variant "${v.displayLabel}"`, 'Close', { duration: 3000 }),
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/products']);
  }
}
