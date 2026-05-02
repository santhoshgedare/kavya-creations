import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { VariantService } from '../../../core/services/variant.service';
import { Category, CategoryAttribute, ProductAttribute } from '../../../core/models/product.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

// ── Admin Categories Component ────────────────────────────────────────────────

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatChipsModule, MatCardModule, MatDialogModule,
  ],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly variantService = inject(VariantService);
  private readonly router = inject(Router);
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

  openCreate(): void {
    this.router.navigate(['/admin/categories/create']);
  }

  openEdit(category: Category): void {
    this.router.navigate(['/admin/categories/edit', category.id]);
  }

  deleteCategory(cat: Category): void {
    const data: ConfirmDialogData = {
      title: 'Delete Category',
      message: `Are you sure you want to delete "${cat.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: 'warn',
      icon: 'delete_forever',
    };
    this.dialog.open(ConfirmDialogComponent, { data, width: '400px' })
      .afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.productService.deleteCategory(cat.id).subscribe({
          next: () => {
            this.snackBar.open('Deleted', 'Close', { duration: 2000 });
            this.loadCategories();
            if (this.selectedCategory()?.id === cat.id) this.selectedCategory.set(null);
          },
          error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to delete', 'Close', { duration: 3000 }),
        });
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
    const data: ConfirmDialogData = {
      title: 'Remove Attribute',
      message: 'Remove this attribute from the category?',
      confirmLabel: 'Remove',
      confirmColor: 'warn',
      icon: 'link_off',
    };
    this.dialog.open(ConfirmDialogComponent, { data, width: '360px' })
      .afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.variantService.removeAttributeFromCategory(mappingId).subscribe({
          next: () => {
            this.snackBar.open('Removed', 'Close', { duration: 2000 });
            this.loadCategoryAttributes(this.selectedCategory()!.id);
          },
          error: () => this.snackBar.open('Failed to remove', 'Close', { duration: 3000 }),
        });
      });
  }

  unmappedAttributes(): ProductAttribute[] {
    const mapped = new Set(this.categoryAttributes().map(ca => ca.attributeId));
    return this.allAttributes().filter(a => !mapped.has(a.id));
  }
}

