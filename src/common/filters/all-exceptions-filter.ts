/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { appLogger } from '@common/logger/logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';
    const requestId = (request as any).requestId ?? 'N/A';
    appLogger.error(
      `[ERR ${requestId}] ${request.method} ${request.url} | Status ${status} | Message ${JSON.stringify(message)}`,
      {
        stack: exception.stack,
        requestId,
      },
    );
    const errorResponse = typeof message === 'string' ? { message } : ({ message } as Record<string, any>);

    response.status(status).json({
      requestId,
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorResponse,
    });
  }
}
