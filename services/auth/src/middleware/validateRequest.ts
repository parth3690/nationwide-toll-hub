import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ERROR_CODES, createError } from '@toll-hub/shared';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    throw createError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid request parameters',
      400,
      errorDetails
    );
  }

  next();
};
