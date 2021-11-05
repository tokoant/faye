import { Request, Response, NextFunction } from 'express';
import { buildValidationErrorParams } from '../utils/error';

export const prepareTask = async ( req:Request, res:Response, next:NextFunction ) => {

  // validate required params
  const Task = global.faye?.Task;
  const taskId = req.params.taskId;
  const options = req.body.scriptParams || {};

  if (!Task) next(buildValidationErrorParams('Faye is not ready to accept Task yet'));
  if (!taskId) next(buildValidationErrorParams('need to provide taskId'));

  // make sure no same task with given taskId
  let task = Task.findById(taskId);

  if (task) next(buildValidationErrorParams(`already have running task with id ${taskId}`));
  
  // create a task 
  try {
    task = (!task) ? Task.createTask({ taskId, options }) : task;
  }catch(err){
    next(err);
  }

  res.locals.payload = task;
  next();
};

export const getAllRunningTask = async ( _req:Request, res:Response, next:NextFunction ) => {
  const Task = global.faye?.Task;

  res.locals.payload = {
    data: Task.getAllTask()
  };
  next();
};
