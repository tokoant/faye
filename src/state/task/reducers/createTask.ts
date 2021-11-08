import { TaskState } from '../index';
import fs from 'fs';

interface CreateTaskParams {
  taskId: number,
  options: object
}

const STATE_FILE_PATH = '/Users/antoni.xu/faye/records/tasks.rec';
const promiseFs = fs.promises;

const createTask = async (params:CreateTaskParams) => {
  
  const Task = global.faye?.Task;

  const taskState:TaskState = {
    id: params.taskId,
    started: (new Date()).getTime(),
    options: params.options,
    logPath: '',
  };

  Task.queue.push(taskState);

  // write to file
  try {
    await promiseFs.writeFile(STATE_FILE_PATH, JSON.stringify(Task.queue));
  }catch(err){
    console.log(err);
  }

  return taskState;
}

export default createTask;
