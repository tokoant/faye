import { Request, Response, NextFunction } from 'express';
import { taskStore, Task } from '../stores/states/task';

export const getCurrentTasks = (_req: Request, res: Response, next: NextFunction) => {
  const state:{tasks:Task[]} = taskStore.getState();
  res.locals.payload = state.tasks;
  next();
};

export const getTask = (req: Request, res: Response, next: NextFunction) => {
  const state:{tasks:Task[]} = taskStore.getState();
  const currentTaskId = req.params.taskId;
  const task = state.tasks.find(({ taskId }) => taskId.toString() === currentTaskId.toString());
  res.locals.payload = task;
  next();
};
