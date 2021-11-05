import { Request, Response, NextFunction } from 'express';

interface ErrorObject {
  type: string;
  error: {
    reason: string;
  };
}

export const handleError = (err:ErrorObject, _req:Request, res:Response, _next: NextFunction ) => {
  const status = (err.type === 'validation') ? 400 : 500;
  res.status(status);
  res.json({error: err.error});
}

export const responseWithPayload = ( _req:Request, res:Response, next: NextFunction ) => {
  res.status(200);
  res.json(res.locals.payload);
  next()
}
