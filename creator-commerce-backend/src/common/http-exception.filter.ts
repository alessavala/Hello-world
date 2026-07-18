import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.resolve(exception);

    const body: ErrorBody = {
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).json(body);
  }

  private resolve(exception: unknown): { status: number; message: string | string[]; error: string } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const status = exception.getStatus();
      if (typeof response === 'string') {
        return { status, message: response, error: exception.name };
      }
      const asObject = response as { message?: string | string[]; error?: string };
      return {
        status,
        message: asObject.message ?? exception.message,
        error: asObject.error ?? exception.name,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return { status: HttpStatus.BAD_REQUEST, message: 'Invalid request payload', error: 'BadRequest' };
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error', error: 'InternalServerError' };
  }

  private resolvePrismaError(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        return { status: HttpStatus.CONFLICT, message: `A record with the same ${target} already exists`, error: 'Conflict' };
      }
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Resource not found', error: 'NotFound' };
      case 'P2003':
        return { status: HttpStatus.BAD_REQUEST, message: 'Referenced resource does not exist', error: 'BadRequest' };
      default:
        this.logger.error(`Unhandled Prisma error ${exception.code}`, exception.message);
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error', error: 'InternalServerError' };
    }
  }
}
