import { Request, Response, NextFunction } from 'express';

interface ErrorObject {
  type: string;
  message: string;
  error: {
    reason: string;
  };
}

export const handleError = (err:ErrorObject, _req:Request, res:Response, _next: NextFunction ) => {
  let status = 500;
  let error = err.error;

  if (err.type === 'validation') {
    status = 400;
  }else{
    error = {
      reason: err.message
    };
  }

  res.status(status);
  res.json({error});
}

export const responseWithPayload = ( _req:Request, res:Response, next: NextFunction ) => {
  res.status(200);
  res.json(res.locals.payload);
  next()
}
