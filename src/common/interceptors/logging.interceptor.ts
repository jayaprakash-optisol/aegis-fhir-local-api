import { appLogger } from '@common/logger/logger';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body } = req;
    const requestId = req.requestId;

    appLogger.log(`[REQ ${requestId}] ${method} ${url} : ${JSON.stringify(body)}`);
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        appLogger.log(`[RES ${requestId}] ${method} ${url} | took ${Date.now() - now}ms`);
      }),
    );
  }
}
