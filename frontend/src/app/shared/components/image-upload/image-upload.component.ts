import {
  Component, EventEmitter, Input, Output, signal, HostListener, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface UploadedFile {
  file: File;
  previewUrl: string;
  progress: number;       // 0-100; 100 = done
  url: string | null;     // server URL once uploaded
  error: string | null;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
})
export class ImageUploadComponent {
  @Input() maxFiles = 10;
  /** Emits the list of server-side URLs whenever the set of uploaded files changes */
  @Output() urlsChange = new EventEmitter<string[]>();
  /** Pre-populate with existing URLs (edit mode) */
  @Input() set existingUrls(urls: string[]) {
    this._existing = urls ?? [];
    this.emitUrls();
  }

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  files = signal<UploadedFile[]>([]);
  isDragOver = signal(false);

  private _existing: string[] = [];

  constructor(private readonly snackBar: MatSnackBar) {}

  @HostListener('dragover', ['$event'])
  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragOver.set(true); }

  @HostListener('dragleave', ['$event'])
  onDragLeave(e: DragEvent) { e.preventDefault(); this.isDragOver.set(false); }

  @HostListener('drop', ['$event'])
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragOver.set(false);
    const droppedFiles = Array.from(e.dataTransfer?.files ?? []);
    this.addFiles(droppedFiles);
  }

  openFilePicker(): void {
    this.fileInputRef.nativeElement.value = '';
    this.fileInputRef.nativeElement.click();
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    this.addFiles(selected);
  }

  private addFiles(incoming: File[]): void {
    const current = this.files();
    const available = this.maxFiles - current.length;
    if (available <= 0) {
      this.snackBar.open(`Maximum ${this.maxFiles} images allowed`, 'Close', { duration: 3000 });
      return;
    }
    const toAdd = incoming.slice(0, available);
    const invalid = incoming.slice(available);
    if (invalid.length) {
      this.snackBar.open(`Only ${available} more image(s) can be added`, 'Close', { duration: 3000 });
    }

    for (const file of toAdd) {
      const validationError = this.validateFile(file);
      if (validationError) {
        this.snackBar.open(validationError, 'Close', { duration: 4000 });
        continue;
      }
      const reader = new FileReader();
      const entry: UploadedFile = { file, previewUrl: '', progress: 0, url: null, error: null };
      reader.onload = (ev) => {
        entry.previewUrl = ev.target?.result as string;
        this.files.update(list => [...list]);
      };
      reader.readAsDataURL(file);
      this.files.update(list => [...list, entry]);
    }
  }

  private validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.has(file.type)) {
      return `"${file.name}" has an unsupported type. Use JPG, PNG, WebP, or GIF.`;
    }
    const lastDot = file.name.lastIndexOf('.');
    if (lastDot < 0) {
      return `"${file.name}" has no file extension. Use JPG, PNG, WebP, or GIF.`;
    }
    const ext = file.name.slice(lastDot).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      return `"${file.name}" has an unsupported extension.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `"${file.name}" is too large. Maximum size is 10 MB.`;
    }
    return null;
  }

  removeFile(index: number): void {
    const removed = this.files()[index];
    this.files.update(list => list.filter((_, i) => i !== index));
    this.emitUrls();
    if (removed.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removed.previewUrl);
    }
  }

  removeExisting(url: string): void {
    this._existing = this._existing.filter(u => u !== url);
    this.emitUrls();
  }

  moveUp(index: number): void {
    if (index === 0) return;
    this.files.update(list => {
      const copy = [...list];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      return copy;
    });
    this.emitUrls();
  }

  moveDown(index: number): void {
    const list = this.files();
    if (index >= list.length - 1) return;
    this.files.update(arr => {
      const copy = [...arr];
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      return copy;
    });
    this.emitUrls();
  }

  /** Called by parent after server upload completes with the returned URLs */
  markUploaded(fileIndex: number, serverUrl: string): void {
    this.files.update(list => {
      const copy = [...list];
      copy[fileIndex] = { ...copy[fileIndex], url: serverUrl, progress: 100 };
      return copy;
    });
    this.emitUrls();
  }

  setProgress(fileIndex: number, progress: number): void {
    this.files.update(list => {
      const copy = [...list];
      copy[fileIndex] = { ...copy[fileIndex], progress };
      return copy;
    });
  }

  setError(fileIndex: number, error: string): void {
    this.files.update(list => {
      const copy = [...list];
      copy[fileIndex] = { ...copy[fileIndex], error, progress: 0 };
      return copy;
    });
  }

  /** Return pending (not yet uploaded) files */
  getPendingFiles(): File[] {
    return this.files().filter(f => !f.url && !f.error).map(f => f.file);
  }

  /** All URLs: existing + newly uploaded */
  getAllUrls(): string[] {
    const newUrls = this.files().filter(f => f.url).map(f => f.url!);
    return [...this._existing, ...newUrls];
  }

  get existingImages(): string[] { return this._existing; }

  private emitUrls(): void {
    this.urlsChange.emit(this.getAllUrls());
  }
}
