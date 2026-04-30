import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { VariantService } from '../../../core/services/variant.service';
import { ProductAttribute, ProductAttributeValue, Category, CategoryAttribute } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-admin-attributes',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule,
    MatProgressSpinnerModule, MatExpansionModule, MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './admin-attributes.component.html',
  styleUrl: './admin-attributes.component.scss',
})
export class AdminAttributesComponent implements OnInit {
  private readonly variantService = inject(VariantService);
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  loading = signal(false);
  attributes = signal<ProductAttribute[]>([]);
  categories = signal<Category[]>([]);
  selectedAttribute = signal<ProductAttribute | null>(null);

  attributeForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    displayName: ['', [Validators.required, Validators.maxLength(100)]],
    inputType: ['select', Validators.required],
  });

  valueForm = this.fb.group({
    value: ['', [Validators.required, Validators.maxLength(100)]],
    displayValue: ['', [Validators.required, Validators.maxLength(100)]],
    displayOrder: [0],
  });

  mappingForm = this.fb.group({
    categoryId: ['', Validators.required],
    attributeId: ['', Validators.required],
    displayOrder: [0],
    isRequired: [false],
  });

  ngOnInit(): void {
    this.loadAttributes();
    this.loadCategories();
  }

  loadAttributes(): void {
    this.loading.set(true);
    this.variantService.getAllAttributes().subscribe({
      next: (attrs) => { this.attributes.set(attrs); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
    });
  }

  createAttribute(): void {
    if (this.attributeForm.invalid) return;
    const val = this.attributeForm.value;
    this.variantService.createAttribute({
      name: val.name!,
      displayName: val.displayName!,
      inputType: val.inputType!,
    }).subscribe({
      next: () => {
        this.snackBar.open('Attribute created', 'Close', { duration: 2000 });
        this.attributeForm.reset({ inputType: 'select' });
        this.loadAttributes();
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to create', 'Close', { duration: 3000 }),
    });
  }

  deleteAttribute(id: string): void {
    if (!confirm('Delete this attribute?')) return;
    this.variantService.deleteAttribute(id).subscribe({
      next: () => { this.snackBar.open('Deleted', 'Close', { duration: 2000 }); this.loadAttributes(); },
      error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 }),
    });
  }

  selectAttribute(attr: ProductAttribute): void {
    this.selectedAttribute.set(attr);
    this.valueForm.reset({ displayOrder: 0 });
  }

  addValue(): void {
    if (this.valueForm.invalid || !this.selectedAttribute()) return;
    const attr = this.selectedAttribute()!;
    const val = this.valueForm.value;
    this.variantService.addAttributeValue(attr.id, {
      value: val.value!,
      displayValue: val.displayValue!,
      displayOrder: val.displayOrder ?? 0,
    }).subscribe({
      next: () => {
        this.snackBar.open('Value added', 'Close', { duration: 2000 });
        this.valueForm.reset({ displayOrder: 0 });
        this.loadAttributes();
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to add value', 'Close', { duration: 3000 }),
    });
  }

  deleteValue(valueId: string): void {
    if (!confirm('Delete this value?')) return;
    this.variantService.deleteAttributeValue(valueId).subscribe({
      next: () => { this.snackBar.open('Deleted', 'Close', { duration: 2000 }); this.loadAttributes(); },
      error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 }),
    });
  }

  mapToCategory(): void {
    if (this.mappingForm.invalid) return;
    const val = this.mappingForm.value;
    this.variantService.mapAttributeToCategory({
      categoryId: val.categoryId!,
      attributeId: val.attributeId!,
      displayOrder: val.displayOrder ?? 0,
      isRequired: val.isRequired ?? false,
    }).subscribe({
      next: () => {
        this.snackBar.open('Mapped to category', 'Close', { duration: 2000 });
        this.mappingForm.reset({ displayOrder: 0, isRequired: false });
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to map', 'Close', { duration: 3000 }),
    });
  }
}
