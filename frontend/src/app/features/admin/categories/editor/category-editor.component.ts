import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { ProductService } from '../../../../core/services/product.service';
import { VariantService } from '../../../../core/services/variant.service';
import { Category, CategoryAttribute, ProductAttribute } from '../../../../core/models/product.model';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-category-editor',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSelectModule,
    MatCheckboxModule, MatChipsModule, MatDividerModule, MatDialogModule,
    MatExpansionModule,
    ImageUploadComponent,
  ],
  templateUrl: './category-editor.component.html',
  styleUrl: './category-editor.component.scss',
})
export class CategoryEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly variantService = inject(VariantService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  @ViewChild('imageUpload') imageUploadRef!: ImageUploadComponent;

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  categoryId = signal<string | null>(null);

  allAttributes = signal<ProductAttribute[]>([]);
  categoryAttributes = signal<CategoryAttribute[]>([]);

  showCreateAttrForm = signal(false);
  creatingAttr = signal(false);
  addingValueToAttrId = signal<string | null>(null);

  existingImageUrls: string[] = [];

  form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: [''],
    displayOrder: [0],
  });

  mappingForm = this.fb.group({
    attributeId: ['', Validators.required],
    displayOrder: [0],
    isRequired: [false],
  });

  createAttrForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-z0-9_]+$/)]],
    displayName: ['', [Validators.required, Validators.maxLength(100)]],
    inputType: ['chips', Validators.required],
    displayOrder: [0],
    isRequired: [false],
  });

  addValueForm = this.fb.group({
    value: ['', [Validators.required, Validators.maxLength(100)]],
    displayValue: ['', [Validators.required, Validators.maxLength(100)]],
    displayOrder: [0],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.categoryId.set(id);
      this.loadCategory(id);
      this.loadCategoryAttributes(id);
    }
    this.variantService.getAllAttributes().subscribe(attrs => this.allAttributes.set(attrs));
  }

  private loadCategory(id: string): void {
    this.loading.set(true);
    this.productService.getCategories().subscribe({
      next: (cats) => {
        const cat = cats.find(c => c.id === id);
        if (cat) {
          this.existingImageUrls = cat.imageUrl ? [cat.imageUrl] : [];
          this.form.patchValue({
            name: cat.name,
            slug: cat.slug,
            description: cat.description ?? '',
            displayOrder: cat.displayOrder,
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadCategoryAttributes(id: string): void {
    this.variantService.getCategoryAttributes(id).subscribe({
      next: (attrs) => this.categoryAttributes.set(attrs),
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const pendingFiles = this.imageUploadRef?.getPendingFiles() ?? [];
    if (pendingFiles.length > 0) {
      this.saving.set(true);
      this.productService.uploadImages(pendingFiles).subscribe({
        next: (urls) => {
          this.saving.set(false);
          this.submitForm({ ...this.form.value as Record<string, unknown>, imageUrl: urls[0] ?? '' });
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Image upload failed. Please try again.', 'Close', { duration: 4000 });
        },
      });
    } else {
      const existingUrl = this.imageUploadRef?.existingImages[0] ?? '';
      this.submitForm({ ...this.form.value as Record<string, unknown>, imageUrl: existingUrl });
    }
  }

  private submitForm(data: Record<string, unknown>): void {
    this.saving.set(true);
    if (this.isEdit()) {
      this.productService.updateCategory(this.categoryId()!, data).subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Category updated!', 'Close', { duration: 2000 });
          this.router.navigate(['/admin/categories']);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err?.error?.message ?? 'Failed to update', 'Close', { duration: 3000 });
        },
      });
    } else {
      this.productService.createCategory(data).subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Category created!', 'Close', { duration: 2000 });
          this.router.navigate(['/admin/categories']);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err?.error?.message ?? 'Failed to create', 'Close', { duration: 3000 });
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/categories']);
  }

  mapAttribute(): void {
    if (this.mappingForm.invalid || !this.categoryId()) return;
    const val = this.mappingForm.value;
    this.variantService.mapAttributeToCategory({
      categoryId: this.categoryId()!,
      attributeId: val.attributeId!,
      displayOrder: val.displayOrder ?? 0,
      isRequired: val.isRequired ?? false,
    }).subscribe({
      next: () => {
        this.snackBar.open('Attribute mapped!', 'Close', { duration: 2000 });
        this.mappingForm.reset({ displayOrder: 0, isRequired: false });
        this.loadCategoryAttributes(this.categoryId()!);
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
            this.loadCategoryAttributes(this.categoryId()!);
          },
          error: () => this.snackBar.open('Failed to remove', 'Close', { duration: 3000 }),
        });
      });
  }

  unmappedAttributes(): ProductAttribute[] {
    const mapped = new Set(this.categoryAttributes().map(ca => ca.attributeId));
    return this.allAttributes().filter(a => !mapped.has(a.id));
  }

  createAttributeAndMap(): void {
    if (this.createAttrForm.invalid || !this.categoryId()) return;
    const val = this.createAttrForm.value;
    this.creatingAttr.set(true);
    this.variantService.createAttribute({
      name: val.name!,
      displayName: val.displayName!,
      inputType: val.inputType!,
    }).subscribe({
      next: (attrId) => {
        this.variantService.mapAttributeToCategory({
          categoryId: this.categoryId()!,
          attributeId: attrId,
          displayOrder: val.displayOrder ?? 0,
          isRequired: val.isRequired ?? false,
        }).subscribe({
          next: () => {
            this.snackBar.open(`Attribute "${val.displayName}" created and mapped!`, 'Close', { duration: 3000 });
            this.createAttrForm.reset({ inputType: 'chips', displayOrder: 0, isRequired: false });
            this.showCreateAttrForm.set(false);
            this.variantService.getAllAttributes().subscribe(attrs => this.allAttributes.set(attrs));
            this.loadCategoryAttributes(this.categoryId()!);
            this.creatingAttr.set(false);
          },
          error: (err) => {
            this.snackBar.open(err?.error?.message ?? 'Failed to map new attribute', 'Close', { duration: 3000 });
            this.creatingAttr.set(false);
          },
        });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to create attribute', 'Close', { duration: 3000 });
        this.creatingAttr.set(false);
      },
    });
  }

  addValueToAttribute(attributeId: string): void {
    if (this.addValueForm.invalid) return;
    const val = this.addValueForm.value;
    this.variantService.addAttributeValue(attributeId, {
      value: val.value!,
      displayValue: val.displayValue!,
      displayOrder: val.displayOrder ?? 0,
    }).subscribe({
      next: () => {
        this.snackBar.open('Value added!', 'Close', { duration: 2000 });
        this.addValueForm.reset({ displayOrder: 0 });
        this.addingValueToAttrId.set(null);
        this.variantService.getAllAttributes().subscribe(attrs => this.allAttributes.set(attrs));
        this.loadCategoryAttributes(this.categoryId()!);
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to add value', 'Close', { duration: 3000 }),
    });
  }

  startAddValue(attributeId: string): void {
    this.addingValueToAttrId.set(attributeId);
    this.addValueForm.reset({ displayOrder: 0 });
  }

  cancelAddValue(): void {
    this.addingValueToAttrId.set(null);
    this.addValueForm.reset({ displayOrder: 0 });
  }
}
