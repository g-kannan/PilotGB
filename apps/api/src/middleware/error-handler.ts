import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError, internalError } from '../errors.js';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: error.message,
      details: error.details ?? null,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.flatten(),
    });
    return;
  }

  console.error('Unexpected error', error);
  const fallback = internalError('Unexpected server error');
  res.status(fallback.status).json({
    error: fallback.message,
  });
};
