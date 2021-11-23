import { Request, Response, NextFunction } from 'express';
import { runningTaskStore, saveStateToFile } from '../state/runningTask';

export const getCurrentRunningTasks = async (_req: Request, res: Response, next: NextFunction) => {
  const unsubscribeStore = runningTaskStore.subscribe(() => saveStateToFile(runningTaskStore.getState()));

  runningTaskStore.dispatch({ type: 'runningTask/incremented' });

  res.locals.payload = runningTaskStore.getState();
  unsubscribeStore();
  next();
};
