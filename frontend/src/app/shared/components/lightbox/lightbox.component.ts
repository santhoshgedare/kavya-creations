import { Component, inject, signal, HostListener } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface LightboxData {
  images: { url: string; altText?: string }[];
  initialIndex?: number;
}

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './lightbox.component.html',
  styleUrl: './lightbox.component.scss',
})
export class LightboxComponent {
  readonly dialogRef = inject(MatDialogRef<LightboxComponent>);
  readonly data = inject<LightboxData>(MAT_DIALOG_DATA);

  currentIndex = signal(this.data.initialIndex ?? 0);
  imageLoading = signal(true);
  imageError = signal(false);

  get currentImage() {
    return this.data.images[this.currentIndex()];
  }

  get hasMultiple() {
    return this.data.images.length > 1;
  }

  prev(): void {
    this.imageLoading.set(true);
    this.imageError.set(false);
    const len = this.data.images.length;
    this.currentIndex.update(i => (i - 1 + len) % len);
  }

  next(): void {
    this.imageLoading.set(true);
    this.imageError.set(false);
    const len = this.data.images.length;
    this.currentIndex.update(i => (i + 1) % len);
  }

  goTo(index: number): void {
    this.imageLoading.set(true);
    this.imageError.set(false);
    this.currentIndex.set(index);
  }

  onImageLoad(): void { this.imageLoading.set(false); }
  onImageError(): void { this.imageLoading.set(false); this.imageError.set(true); }

  close(): void { this.dialogRef.close(); }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape')     { this.close(); }
    if (e.key === 'ArrowLeft')  { this.prev(); }
    if (e.key === 'ArrowRight') { this.next(); }
  }
}
