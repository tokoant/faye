import { Request, Response } from 'express';
import stores from '../stores';

export const getStoreState = (_req: Request, res: Response) => {
  res.json(stores.getState());
}
