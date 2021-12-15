import { Request, Response } from 'express';
import stores from '../stores';

export const getStoreState = (_req: Request, res: Response) => {
  res.json(stores.getState());
}

export const resetStoreState = (_req: Request, res: Response) => {
  stores.dispatch({ type: 'SAGA_PROMISE_RESET' });
  stores.dispatch({ type: 'SSH_RUNNER_RESET' });
  res.json(stores.getState());
}