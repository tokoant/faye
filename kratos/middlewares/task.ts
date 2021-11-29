import { Request, Response, NextFunction } from 'express';
import { taskStore, Task } from '../state/task';

export const getCurrentTasks = (_req: Request, res: Response, next: NextFunction) => {
  res.locals.payload = taskStore.getState();
  next();
};

export const getTask = (req: Request, res: Response, next: NextFunction) => {
  const tasks:Task[] = taskStore.getState();
  const currentTaskId = req.params.taskId;
  const task = tasks.find(({ taskId }) => taskId.toString() === currentTaskId.toString());
  res.locals.payload = task;
  next();
};
 