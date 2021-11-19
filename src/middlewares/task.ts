import { Request, Response, NextFunction } from 'express';
import { buildValidationErrorParams } from '../utils/error';
import Tasks, { TaskState } from '../state/tasks';
// import mongoose from 'mongoose';
import fs from 'fs';

const promiseFs = fs.promises;
const TASK_LOG_PATH  = '/Users/antoni.xu/faye/records/task-logs';

export const prepareTask = async ( req:Request, res:Response, next:NextFunction ) => {

  // validate required params
  const taskId = req.params.taskId;
  const options = req.body || {};
  if (!taskId) next(buildValidationErrorParams('need to provide taskId'));

  // make sure no same task with given taskId,
  // TODO: update the check mechanic
  let task = Tasks.find((n: TaskState)=> n.id === taskId);
  if (task) next(buildValidationErrorParams(`already have running task with id ${taskId}`));
  
  // create a task 
  // const taskId = new mongoose.Types.ObjectId();
  const logName = `run-shell-script-${taskId}.log`;
  const logPath = `${TASK_LOG_PATH}/${logName}`;

  task = {
    id: taskId,
    started: (new Date()).getTime(),
    options,
    logPath,
  };
  Tasks.push(task);

  res.locals.payload = task;
  next();
};

export const getAllRunningTask = async ( _req:Request, res:Response, next:NextFunction ) => {
  res.locals.payload = {
    data: Tasks
  };
  next();
};

export const getTaskById = async (  req:Request, res:Response, next:NextFunction ) => {

  // validate required params
  const taskId = req.params.taskId;

  if (!taskId) next(buildValidationErrorParams('need to provide taskId'));

  const task = Tasks.find(n => n.id.toString() === taskId);

  if (!task) next(buildValidationErrorParams('there no running task with that id'));

  res.locals.payload = task;
  next();
}

export const deleteTaskById = async (  req:Request, res:Response, next:NextFunction ) => {

  // validate required params
  const taskId = req.params.taskId;

  if (!taskId) next(buildValidationErrorParams('need to provide taskId'));

  // try delete running task
  try {

    // find task to be delete, throw error if no task found
    const taskIndex:number = Tasks.findIndex((n:TaskState) => n.id.toString() === taskId);
  
    if (taskIndex === -1) throw new Error('no task with that id in task queue');
  
    // delete task from queue
    Tasks.splice(taskIndex, 1);
  
    // delete log file
    const logName = `run-shell-script-${taskId}.log`;
    await promiseFs.unlink(`${TASK_LOG_PATH}/${logName}`)

  }catch(err){
    next(err)
  }

  res.locals.payload = { result: 'successfully delete the task' };
  next();
}


// kill implementation
// - ssh client disconnect
// - clean up logFileStream