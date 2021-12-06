import { Request, Response, NextFunction } from 'express';
import { taskStore, Task } from '../stores/states/task';
import { actionPromiseCreator, runActionsSequentially } from '../utils/promise';
// import stores from '../stores';
// import { compose } from 'async';

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
 
export const runDeploy = async (_req: Request, res: Response) => {
  
  // this part will give a chance to dispatch create promise so it can be restored later on
  const promiseActions = actionPromiseCreator(
    [
      { name: 'getCloudRunConfig', params: { gitHash: 123 } },
      { name: 'updateExpiresDate', params: { featureNumber: 1234 } },
      // { name: 'checkCloudRunManifest' },
    ]
  )

  console.log(promiseActions, "PROMISE ACTION");

  // this part will execute all promise action sequentially 
  // on each execution store of promise will be updated
  runActionsSequentially(promiseActions);

  res.json({ states: 'running deployment' });
}