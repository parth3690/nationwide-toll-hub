import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES, createError, isTollHubError } from '@toll-hub/shared';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: error.details || error.message,
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: {
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'Invalid token',
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      error: {
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'Token has expired',
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle custom errors
  if (isTollHubError(error)) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle database errors
  if (error.code === '23505') { // Unique constraint violation
    res.status(409).json({
      error: {
        code: ERROR_CODES.CONFLICT,
        message: 'Resource already exists',
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (error.code === '23503') { // Foreign key constraint violation
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid reference',
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle rate limiting errors
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    res.status(429).json({
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded',
        requestId: req.headers['x-request-id'] as string,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle default error
  res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      requestId: req.headers['x-request-id'] as string,
      timestamp: new Date().toISOString(),
    },
  });
};
