import { TaskState } from '../index';
// import fs from 'fs';

// const promiseFs = fs.promises;

interface CreateTaskParams {
  taskId: number,
  options: object
}

const createTask = (params:CreateTaskParams) => {
  
  const Task = global.faye?.Task;

  const taskState:TaskState = {
    id: params.taskId,
    started: (new Date()).getTime(),
    options: params.options,
    logPath: '',
  };

  Task.queue.push(taskState);

  return taskState;
  // const data = await promiseFs.readFile('./records/test.txt');
}

export default createTask;
