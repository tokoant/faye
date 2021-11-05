import { Request, Response, NextFunction } from 'express';
import Task from './task';

const initialize = () => {

  if (global.faye === undefined) global.faye = {};

  return (_req: Request, _res: Response, next: NextFunction) => {
    global.faye = {
      Task,
    }
  
    next();
  }
}

const fayeState = { initialize };

export default fayeState;
