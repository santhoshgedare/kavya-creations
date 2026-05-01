import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Converts a relative server path (e.g. /uploads/foo.jpg) to a full URL
 * by prepending the staticBaseUrl from the environment.
 * Absolute URLs (http/https) and empty/null values are handled gracefully.
 *
 * Usage: <img [src]="imagePath | imageUrl">
 *        <img [src]="imagePath | imageUrl:'assets/fallback.jpg'">
 */
@Pipe({
  name: 'imageUrl',
  standalone: true,
  pure: true,
})
export class ImageUrlPipe implements PipeTransform {
  transform(url: string | null | undefined, fallback = 'assets/placeholder.jpg'): string {
    if (!url) return fallback;
    // Already absolute — return as-is (handles Unsplash, CDN, etc.)
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      return url;
    }
    // Relative path from the backend — prepend static base
    if (url.startsWith('/')) {
      return `${environment.staticBaseUrl}${url}`;
    }
    return url;
  }
}
