import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { VariantService } from '../../../core/services/variant.service';
import {
  ProductListItem, Category, ProductStatus,
  CategoryAttribute, ProductVariant,
} from '../../../core/models/product.model';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';

// ── Variant row used in wizard step 3 ─────────────────────────────────────────
interface VariantRow {
  attributeValueIds: string[];
  displayLabel: string;
  sku: string;
  price: number;
  stock: number;
  existingVariantId?: string;
}

// ── Product Wizard Dialog ─────────────────────────────────────────────────────
@Component({
  selector: 'app-product-wizard',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatButtonModule, MatProgressBarModule,
    MatStepperModule, MatTableModule, MatIconModule, MatChipsModule, MatCardModule,
    MatProgressSpinnerModule, ImageUploadComponent,
  ],
  template: `
<h2 mat-dialog-title>{{ data.product ? 'Edit Product' : 'New Product' }}</h2>
<mat-dialog-content class="wizard-dialog-content">
  <mat-stepper linear #stepper orientation="horizontal" class="product-stepper">

    <!-- STEP 1: Basic Info -->
    <mat-step [stepControl]="basicForm" label="Basic Info">
      <form [formGroup]="basicForm" class="step-form">
        <div class="form-section">
          <h3 class="section-title">Product Information</h3>
          <div class="form-row">
            <mat-form-field appearance="outline" class="flex2">
              <mat-label>Product Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. Gold Necklace">
              @if (basicForm.get('name')?.touched && basicForm.get('name')?.errors?.['required']) {
                <mat-error>Name is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="flex1">
              <mat-label>Slug</mat-label>
              <input matInput formControlName="slug" placeholder="e.g. gold-necklace">
              <mat-hint>URL-friendly identifier</mat-hint>
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Short Description</mat-label>
            <textarea matInput formControlName="shortDescription" rows="2" placeholder="Brief description shown in listings"></textarea>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Full Description</mat-label>
            <textarea matInput formControlName="description" rows="4" placeholder="Detailed product description"></textarea>
          </mat-form-field>
        </div>
        <div class="form-section">
          <h3 class="section-title">Category & Details</h3>
          <div class="form-row">
            <mat-form-field appearance="outline" class="flex1">
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId">
                @for (cat of data.categories; track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                }
              </mat-select>
              @if (basicForm.get('categoryId')?.touched && basicForm.get('categoryId')?.errors?.['required']) {
                <mat-error>Category is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="flex1">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option [value]="1">Active</mat-option>
                <mat-option [value]="2">Inactive</mat-option>
                <mat-option [value]="3">Out of Stock</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field appearance="outline" class="flex1">
              <mat-label>Material</mat-label>
              <input matInput formControlName="material" placeholder="e.g. 22K Gold">
            </mat-form-field>
            <mat-form-field appearance="outline" class="flex1">
              <mat-label>Weight</mat-label>
              <input matInput formControlName="weight" placeholder="e.g. 5g">
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field appearance="outline" class="flex1">
              <mat-label>Base Price (Rs.)</mat-label>
              <input matInput type="number" formControlName="price">
              <mat-hint>Used as default for variants</mat-hint>
              @if (basicForm.get('price')?.touched && basicForm.get('price')?.errors?.['required']) {
                <mat-error>Price is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="flex1">
              <mat-label>Discount Price (Rs.)</mat-label>
              <input matInput type="number" formControlName="discountPrice">
            </mat-form-field>
            <mat-form-field appearance="outline" class="flex1">
              <mat-label>Stock</mat-label>
              <input matInput type="number" formControlName="stockQuantity">
            </mat-form-field>
          </div>
          <mat-checkbox formControlName="isFeatured" class="featured-check">Mark as Featured</mat-checkbox>
        </div>
      </form>
      <div class="step-actions">
        <button mat-flat-button color="primary" matStepperNext (click)="onStep1Next()">
          Next: Attributes <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </mat-step>

    <!-- STEP 2: Attributes & Variants -->
    <mat-step label="Attributes">
      <div class="step-form">
        @if (loadingAttrs()) {
          <div class="loading-center"><mat-spinner diameter="36"></mat-spinner></div>
        } @else if (categoryAttributes().length === 0) {
          <div class="empty-state">
            <mat-icon>tune</mat-icon>
            <p>No attributes defined for this category. You can skip to the next step.</p>
          </div>
        } @else {
          <div class="form-section">
            <h3 class="section-title">Select Attribute Values</h3>
            <p class="section-hint">Select the values that apply. Variants will be auto-generated from combinations.</p>
            @for (attr of categoryAttributes(); track attr.attributeId) {
              <div class="attr-select-block">
                <label class="attr-label">
                  {{ attr.attributeDisplayName }}
                  @if (attr.isRequired) { <span class="required-mark">*</span> }
                </label>
                <div class="value-chips">
                  @for (val of attr.values; track val.id) {
                    <button mat-stroked-button
                            class="value-chip-btn"
                            [class.selected]="isValueSelected(val.id)"
                            (click)="toggleValue(attr.attributeId, val)">
                      {{ val.displayValue }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
          @if (generatedVariants().length > 0) {
            <div class="form-section">
              <h3 class="section-title">
                <mat-icon>preview</mat-icon>
                Preview - {{ generatedVariants().length }} variants
              </h3>
              <div class="variant-chip-list">
                @for (v of generatedVariants(); track $index) {
                  <mat-chip>{{ v.displayLabel }}</mat-chip>
                }
              </div>
            </div>
          }
        }
      </div>
      <div class="step-actions">
        <button mat-stroked-button matStepperPrevious><mat-icon>arrow_back</mat-icon> Back</button>
        <button mat-flat-button color="primary" matStepperNext (click)="onStep2Next()">
          Next: Pricing <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </mat-step>

    <!-- STEP 3: Variant Pricing -->
    <mat-step label="Pricing">
      <div class="step-form">
        @if (generatedVariants().length === 0) {
          <div class="empty-state">
            <mat-icon>price_change</mat-icon>
            <p>No variants generated. The base price from Step 1 will be used.</p>
          </div>
        } @else {
          <div class="form-section">
            <h3 class="section-title">Set Price & Stock per Variant</h3>
            <p class="section-hint">Edit the price and stock for each variant combination.</p>
            <table class="variant-pricing-table">
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Price (Rs.)</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                @for (variant of generatedVariants(); track $index; let i = $index) {
                  <tr>
                    <td>
                      <div class="variant-label-chips">
                        @for (part of variant.displayLabel.split(' / '); track part) {
                          <mat-chip class="variant-chip">{{ part }}</mat-chip>
                        }
                      </div>
                    </td>
                    <td>
                      <input class="inline-input" type="text" [value]="variant.sku"
                             (change)="updateVariantSku(i, $any($event.target).value)">
                    </td>
                    <td>
                      <input class="inline-input price-input" type="number" [value]="variant.price"
                             (change)="updateVariantPrice(i, +$any($event.target).value)">
                    </td>
                    <td>
                      <input class="inline-input stock-input" type="number" [value]="variant.stock"
                             (change)="updateVariantStock(i, +$any($event.target).value)">
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
      <div class="step-actions">
        <button mat-stroked-button matStepperPrevious><mat-icon>arrow_back</mat-icon> Back</button>
        <button mat-flat-button color="primary" matStepperNext>
          Next: Images <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </mat-step>

    <!-- STEP 4: Images -->
    <mat-step label="Images">
      <div class="step-form">
        <div class="form-section">
          <h3 class="section-title">Product Images</h3>
          <p class="section-hint">Upload up to 8 images. Drag to reorder. First image is the primary image.</p>
          <app-image-upload
            #imageUpload
            [maxFiles]="8"
            [existingUrls]="data.existingImageUrls ?? []"
            (urlsChange)="onUrlsChange($event)">
          </app-image-upload>
        </div>
      </div>
      <div class="step-actions">
        <button mat-stroked-button matStepperPrevious><mat-icon>arrow_back</mat-icon> Back</button>
        <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
          @if (saving()) {
            <mat-spinner diameter="20"></mat-spinner> Saving...
          } @else {
            <mat-icon>save</mat-icon> {{ data.product ? 'Save Changes' : 'Create Product' }}
          }
        </button>
      </div>
    </mat-step>
  </mat-stepper>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
</mat-dialog-actions>
  `,
  styles: [`
    .wizard-dialog-content {
      min-width: 720px;
      max-width: 860px;
      min-height: 520px;
      padding: 0 4px 8px;
      overflow: hidden;
    }
    .product-stepper { width: 100%; }
    .step-form {
      padding: 16px 0;
      min-height: 360px;
      overflow-y: auto;
      max-height: 56vh;
    }
    .form-section {
      margin-bottom: 24px;
      padding: 20px;
      border: 1px solid #eeeeee;
      border-radius: 8px;
      background: #fafafa;
    }
    .section-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 16px;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-hint { font-size: 0.85rem; color: #757575; margin: -8px 0 16px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
    .flex1 { flex: 1; min-width: 140px; }
    .flex2 { flex: 2; min-width: 180px; }
    .full-width { width: 100%; }
    .featured-check { margin: 8px 0 4px; }
    .step-actions { display: flex; gap: 12px; justify-content: flex-end; padding: 12px 0 4px; }
    .loading-center { display: flex; justify-content: center; padding: 32px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px; color: #9e9e9e; text-align: center;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .attr-select-block { margin-bottom: 20px; }
    .attr-label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; color: #444; }
    .required-mark { color: #f44336; }
    .value-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .value-chip-btn { border-radius: 20px !important; padding: 4px 16px !important; font-size: 0.85rem !important; }
    .value-chip-btn.selected { background: #6750a4 !important; color: white !important; }
    .variant-chip-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .variant-pricing-table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; }
    .variant-pricing-table th {
      background: #f5f5f5; padding: 10px 12px; text-align: left;
      font-size: 0.85rem; font-weight: 600; color: #555; border-bottom: 1px solid #e0e0e0;
    }
    .variant-pricing-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .variant-label-chips { display: flex; gap: 4px; flex-wrap: wrap; }
    .variant-chip { font-size: 0.75rem !important; min-height: 24px !important; padding: 0 8px !important; }
    .inline-input {
      border: 1px solid #e0e0e0; border-radius: 4px; padding: 6px 10px;
      font-size: 0.9rem; width: 100%; background: white; outline: none;
    }
    .inline-input:focus { border-color: #6750a4; }
    .price-input { width: 90px; }
    .stock-input { width: 70px; }
  `]
})
export class ProductWizardComponent implements OnInit {
  readonly data = inject<{
    product: ProductListItem | null;
    categories: Category[];
    existingImageUrls?: string[];
    existingVariants?: ProductVariant[];
  }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ProductWizardComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly variantService = inject(VariantService);
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('imageUpload') imageUploadRef!: ImageUploadComponent;

  saving = signal(false);
  loadingAttrs = signal(false);
  categoryAttributes = signal<CategoryAttribute[]>([]);
  generatedVariants = signal<VariantRow[]>([]);

  private selectedValues = new Map<string, { id: string; value: string; displayValue: string }[]>();
  private lastLoadedCategoryId = '';
  private resolvedUrls: string[] = [];

  basicForm = this.fb.group({
    name: [this.data.product?.name ?? '', Validators.required],
    slug: [this.data.product?.slug ?? ''],
    shortDescription: [this.data.product?.shortDescription ?? ''],
    description: [''],
    price: [null as number | null, Validators.required],
    discountPrice: [null as number | null],
    stockQuantity: [this.data.product?.stockQuantity ?? 0, Validators.required],
    categoryId: ['' as string, Validators.required],
    material: [''],
    weight: [''],
    status: [this.data.product?.status ?? 1],
    isFeatured: [this.data.product?.isFeatured ?? false],
  });

  ngOnInit(): void {
    if (this.data.product) {
      this.basicForm.patchValue({
        name: this.data.product.name,
        slug: this.data.product.slug,
        shortDescription: this.data.product.shortDescription ?? '',
        stockQuantity: this.data.product.stockQuantity,
        status: this.data.product.status,
        isFeatured: this.data.product.isFeatured,
      });
    }
    if (this.data.existingVariants?.length) {
      this.generatedVariants.set(this.data.existingVariants.map(v => ({
        attributeValueIds: v.attributeValues.map(av => av.attributeValueId),
        displayLabel: v.attributeValues.map(av => `${av.attributeName}: ${av.displayValue}`).join(' / '),
        sku: v.sku,
        price: v.price,
        stock: v.stockQuantity,
        existingVariantId: v.id,
      })));
    }
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
      this.snackBar.open('Please complete Basic Info (Step 1)', 'Close', { duration: 3000 });
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
          this.dialogRef.close({ ...this.basicForm.value, imageUrls: allUrls, variants: this.generatedVariants() });
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Image upload failed. Please try again.', 'Close', { duration: 4000 });
        },
      });
    } else {
      this.dialogRef.close({ ...this.basicForm.value, imageUrls: this.resolvedUrls, variants: this.generatedVariants() });
    }
  }
}

// ── Admin Products Page ───────────────────────────────────────────────────────
@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CurrencyPipe, MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatProgressSpinnerModule, MatPaginatorModule, MatChipsModule,
    ImageUrlPipe,
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly variantService = inject(VariantService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  products = signal<ProductListItem[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  page = signal(1);
  readonly pageSize = 20;
  readonly displayedColumns = ['name', 'category', 'price', 'stock', 'status', 'featured', 'actions'];
  readonly ProductStatus = ProductStatus;

  ngOnInit(): void {
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts({ page: this.page(), pageSize: this.pageSize }).subscribe({
      next: (r) => { this.products.set(r.items); this.totalCount.set(r.totalCount); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDialog(product: ProductListItem | null): void {
    if (product) {
      this.productService.getProductById(product.id).subscribe({
        next: (fullProduct) => {
          this.variantService.getProductVariants(product.id).subscribe({
            next: (variants) => this.openWizard(product, fullProduct.images.map(img => img.url), variants),
            error: () => this.openWizard(product, fullProduct.images.map(img => img.url), []),
          });
        },
        error: () => this.openWizard(product, [], []),
      });
    } else {
      this.openWizard(null, [], []);
    }
  }

  private openWizard(
    product: ProductListItem | null,
    existingImageUrls: string[],
    existingVariants: ProductVariant[]
  ): void {
    const ref = this.dialog.open(ProductWizardComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { product, categories: this.categories(), existingImageUrls, existingVariants },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const { variants, ...productData } = result;
      if (product) {
        this.productService.updateProduct(product.id, productData).subscribe({
          next: () => {
            this.snackBar.open('Product updated!', 'Close', { duration: 2000 });
            this.saveVariants(product.id, variants ?? []);
            this.loadProducts();
          },
          error: () => this.snackBar.open('Failed to update product', 'Close', { duration: 3000 }),
        });
      } else {
        this.productService.createProduct(productData).subscribe({
          next: (productId) => {
            this.snackBar.open('Product created!', 'Close', { duration: 2000 });
            if (variants?.length) this.saveVariants(productId, variants);
            this.loadProducts();
          },
          error: () => this.snackBar.open('Failed to create product', 'Close', { duration: 3000 }),
        });
      }
    });
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

  deleteProduct(product: ProductListItem): void {
    const data: ConfirmDialogData = {
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: 'warn',
      icon: 'delete_forever',
    };
    this.dialog.open(ConfirmDialogComponent, { data, width: '400px' })
      .afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.productService.deleteProduct(product.id).subscribe({
          next: () => { this.snackBar.open('Product deleted', 'Close', { duration: 2000 }); this.loadProducts(); },
          error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 }),
        });
      });
  }

  onPageChange(event: PageEvent): void { this.page.set(event.pageIndex + 1); this.loadProducts(); }
}
