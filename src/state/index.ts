import { Request, Response, NextFunction } from 'express';
import Task from './task';
import fs from 'fs';

const fsPromise = fs.promises;
const STATE_FILE_PATH = '/Users/antoni.xu/faye/records/tasks.rec';

const initialize = async () => {

  if (global.faye === undefined) global.faye = {};

  // restore task file if any
  const taskFileBuffer = await fsPromise.readFile(STATE_FILE_PATH);
  const restoreableTasks = JSON.parse(taskFileBuffer.toString())

  if (restoreableTasks.length > 0) {
    global.faye = { Task };
    global.faye.Task.queue = restoreableTasks;
  }

  return async (_req: Request, _res: Response, next: NextFunction) => {

    global.faye = {
      Task,
    }
  
    next();
  }
}

const fayeState = { initialize };

export default fayeState;
