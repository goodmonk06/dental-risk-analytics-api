import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * 集中管理されたエラーハンドラ
 */
export async function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // ログ出力
  request.log.error(error);

  // Zodバリデーションエラー
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // アプリケーション定義エラー
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: error.message,
      code: error.code,
    });
  }

  // Prismaエラー
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // ユニーク制約違反
    if (error.code === 'P2002') {
      return reply.code(409).send({
        error: 'Resource already exists',
        code: 'CONFLICT',
        details: error.meta,
      });
    }
    // レコードが見つからない
    if (error.code === 'P2025') {
      return reply.code(404).send({
        error: 'Resource not found',
        code: 'NOT_FOUND',
      });
    }
  }

  // Fastifyバリデーションエラー
  if ('validation' in error && error.validation) {
    return reply.code(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: error.validation,
    });
  }

  // デフォルトエラー
  const statusCode = 'statusCode' in error ? error.statusCode || 500 : 500;
  return reply.code(statusCode).send({
    error: statusCode === 500 ? 'Internal Server Error' : error.message,
    code: 'INTERNAL_ERROR',
  });
}
