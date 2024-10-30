import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.handleBigInt(data)),
    );
  }

  private handleBigInt(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.handleBigInt(item));
    } else if (data !== null && typeof data === 'object') {
      const newObj = {};
      for (const key of Object.keys(data)) {
        const value = data[key];
        if (typeof value === 'bigint') {
          newObj[key] = value.toString();
        } else if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
          newObj[key] = this.handleBigInt(value);
        } else {
          newObj[key] = value;
        }
      }
      return newObj;
    } else if (typeof data === 'bigint') {
      return data.toString();
    } else {
      return data;
    }
  }
}
