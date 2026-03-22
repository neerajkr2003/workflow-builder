import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

/**
 * Validates request against a Zod schema.
 * Schema should define shape: { body?, query?, params? }
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign parsed (transformed) values back to request
      req.body = result.body ?? req.body;
      req.query = result.query ?? req.query;
      req.params = result.params ?? req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};

        error.errors.forEach((err) => {
          // Path: ['body', 'email'] → key: 'email'
          const field = err.path.slice(1).join('.') || err.path.join('.');
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(err.message);
        });

        sendError(res, 'Validation failed. Please check the submitted data.', 422, errors);
        return;
      }

      // Unexpected error
      sendError(res, 'Request validation error.', 400);
    }
  };
};
