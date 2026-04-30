import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="confirm-title">
      @if (data.icon) {
        <mat-icon class="confirm-icon" [class]="'confirm-icon--' + (data.confirmColor ?? 'warn')">{{ data.icon }}</mat-icon>
      }
      {{ data.title }}
    </h2>
    <mat-dialog-content class="confirm-content">
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="confirm-actions">
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-flat-button [color]="data.confirmColor ?? 'warn'" [mat-dialog-close]="true">
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .confirm-icon { font-size: 22px; width: 22px; height: 22px; }
    .confirm-icon--warn  { color: #ef5350; }
    .confirm-icon--primary { color: #6750a4; }
    .confirm-content p { color: #555; margin: 0; line-height: 1.6; }
    .confirm-actions { padding: 8px 0 4px; gap: 8px; }
  `],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
