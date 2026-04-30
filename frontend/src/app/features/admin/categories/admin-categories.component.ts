import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { VariantService } from '../../../core/services/variant.service';
import { Category, CategoryAttribute, ProductAttribute } from '../../../core/models/product.model';

// ── Category Dialog ───────────────────────────────────────────────────────────

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.category ? 'Edit Category' : 'New Category' }}</h2>
    <mat-dialog-content [formGroup]="form" class="cat-dialog-content">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" placeholder="e.g. Necklaces">
        @if (form.get('name')?.touched && form.get('name')?.errors?.['required']) {
          <mat-error>Name is required</mat-error>
        }
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Slug</mat-label>
        <input matInput formControlName="slug" placeholder="e.g. necklaces">
        <mat-hint>Lowercase letters, numbers, hyphens only</mat-hint>
        @if (form.get('slug')?.touched && form.get('slug')?.errors?.['required']) {
          <mat-error>Slug is required</mat-error>
        }
        @if (form.get('slug')?.touched && form.get('slug')?.errors?.['pattern']) {
          <mat-error>Only lowercase letters, numbers and hyphens allowed</mat-error>
        }
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea matInput formControlName="description" rows="3" placeholder="Short category description"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Image URL</mat-label>
        <input matInput formControlName="imageUrl" placeholder="https://...">
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:160px">
        <mat-label>Display Order</mat-label>
        <input matInput type="number" formControlName="displayOrder">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
    </mat-dialog-actions>
  `,
  styles: [
    `.cat-dialog-content { min-width: 460px; display: flex; flex-direction: column; gap: 8px; padding: 16px 0; }
     .full-width { width: 100%; }`
  ]
})
export class CategoryDialogComponent {
  readonly data = inject<{ category: Category | null }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    name: [this.data.category?.name ?? '', Validators.required],
    slug: [this.data.category?.slug ?? '', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: [this.data.category?.description ?? ''],
    imageUrl: [this.data.category?.imageUrl ?? ''],
    displayOrder: [this.data.category?.displayOrder ?? 0],
  });

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }
}

// ── Admin Categories Component ────────────────────────────────────────────────

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatChipsModule, MatCardModule,
  ],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly variantService = inject(VariantService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  allAttributes = signal<ProductAttribute[]>([]);
  categoryAttributes = signal<CategoryAttribute[]>([]);
  selectedCategory = signal<Category | null>(null);
  loading = signal(false);

  readonly displayedColumns = ['name', 'slug', 'products', 'order', 'actions'];

  mappingForm = this.fb.group({
    attributeId: ['', Validators.required],
    displayOrder: [0],
    isRequired: [false],
  });

  ngOnInit(): void {
    this.loadCategories();
    this.variantService.getAllAttributes().subscribe(attrs => this.allAttributes.set(attrs));
  }

  loadCategories(): void {
    this.loading.set(true);
    this.productService.getCategories().subscribe({
      next: (cats) => { this.categories.set(cats); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDialog(category: Category | null): void {
    const ref = this.dialog.open(CategoryDialogComponent, {
      width: '560px',
      data: { category },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      if (category) {
        this.productService.updateCategory(category.id, result).subscribe({
          next: () => { this.snackBar.open('Category updated!', 'Close', { duration: 2000 }); this.loadCategories(); },
          error: () => this.snackBar.open('Failed to update', 'Close', { duration: 3000 }),
        });
      } else {
        this.productService.createCategory(result).subscribe({
          next: () => { this.snackBar.open('Category created!', 'Close', { duration: 2000 }); this.loadCategories(); },
          error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to create', 'Close', { duration: 3000 }),
        });
      }
    });
  }

  deleteCategory(cat: Category): void {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    this.productService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.snackBar.open('Deleted', 'Close', { duration: 2000 });
        this.loadCategories();
        if (this.selectedCategory()?.id === cat.id) this.selectedCategory.set(null);
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to delete', 'Close', { duration: 3000 }),
    });
  }

  selectCategory(cat: Category): void {
    this.selectedCategory.set(cat);
    this.mappingForm.reset({ displayOrder: 0, isRequired: false });
    this.loadCategoryAttributes(cat.id);
  }

  loadCategoryAttributes(categoryId: string): void {
    this.variantService.getCategoryAttributes(categoryId).subscribe({
      next: (attrs) => this.categoryAttributes.set(attrs),
    });
  }

  mapAttribute(): void {
    if (this.mappingForm.invalid || !this.selectedCategory()) return;
    const val = this.mappingForm.value;
    this.variantService.mapAttributeToCategory({
      categoryId: this.selectedCategory()!.id,
      attributeId: val.attributeId!,
      displayOrder: val.displayOrder ?? 0,
      isRequired: val.isRequired ?? false,
    }).subscribe({
      next: () => {
        this.snackBar.open('Attribute mapped!', 'Close', { duration: 2000 });
        this.mappingForm.reset({ displayOrder: 0, isRequired: false });
        this.loadCategoryAttributes(this.selectedCategory()!.id);
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to map', 'Close', { duration: 3000 }),
    });
  }

  removeMapping(mappingId: string): void {
    if (!confirm('Remove this attribute from category?')) return;
    this.variantService.removeAttributeFromCategory(mappingId).subscribe({
      next: () => {
        this.snackBar.open('Removed', 'Close', { duration: 2000 });
        this.loadCategoryAttributes(this.selectedCategory()!.id);
      },
      error: () => this.snackBar.open('Failed to remove', 'Close', { duration: 3000 }),
    });
  }

  unmappedAttributes(): ProductAttribute[] {
    const mapped = new Set(this.categoryAttributes().map(ca => ca.attributeId));
    return this.allAttributes().filter(a => !mapped.has(a.id));
  }
}
