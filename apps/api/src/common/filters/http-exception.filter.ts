import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    // Log the actual error for debugging
    if (!(exception instanceof HttpException)) {
      console.error('Unhandled exception:', exception);
      try {
        const request = ctx.getRequest();
        const fs = require('fs');
        const err = exception as any;
        fs.appendFileSync('/tmp/nestjs-errors.log', `${new Date().toISOString()} ${request?.method} ${request?.url}\n${err?.stack || err?.message || JSON.stringify(exception)}\n\n`);
      } catch (_) {}
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || message;

        if (Array.isArray(responseObj.message)) {
          errors = responseObj.message;
          message = 'Validation failed';
        }
      }
    }

    // Log all 500+ errors to file for debugging
    if (status >= 500) {
      try {
        const request = ctx.getRequest();
        const fs = require('fs');
        const err = exception as any;
        fs.appendFileSync('/tmp/nestjs-errors.log', `${new Date().toISOString()} ${request?.method} ${request?.url}\nStatus: ${status}\n${err?.stack || err?.message || JSON.stringify(exception)}\n\n`);
      } catch (_) {}
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}
