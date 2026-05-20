import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CdnInterceptor implements NestInterceptor {
  private readonly cdnBaseUrl = 'https://cdn.agriconnect.io';

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.transformResponse(data))
    );
  }

  private transformResponse(data: any): any {
    if (!data) return data;

    // Handle arrays (e.g., paginated data.data)
    if (Array.isArray(data)) {
      return data.map(item => this.transformResponse(item));
    }

    // Handle paginated responses where data is under 'data' key
    if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
      return {
        ...data,
        data: this.transformResponse(data.data)
      };
    }

    // Handle objects
    if (typeof data === 'object') {
      const transformed = { ...data };
      
      // If object has an image_key, transform it to a full url
      if (transformed.image_key) {
        transformed.imageUrl = `${this.cdnBaseUrl}/${transformed.image_key}`;
      }

      // Recursively process nested objects
      for (const key in transformed) {
        if (typeof transformed[key] === 'object') {
          transformed[key] = this.transformResponse(transformed[key]);
        }
      }
      return transformed;
    }

    return data;
  }
}
