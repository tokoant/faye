import { TaskState } from '../index';
import fs from 'fs';

const STATE_FILE_PATH = '/Users/antoni.xu/faye/records/tasks.rec';
const promiseFs = fs.promises;

const deleteById = async (taskId: number) => {
  let isDeleted = false;
  const Task = global.faye?.Task;

  // find task to be delete, throw error if no task found
  const taskIndex:number = Task.queue.findIndex((n:TaskState) => n.id === taskId);

  if (taskIndex === -1) throw new Error('no task with that id in task queue');

  // delete task from queue
  Task.queue.splice(taskIndex, 1);

  // TODO: delete log file

  isDeleted = true;

  // write to file
  try {
    await promiseFs.writeFile(STATE_FILE_PATH, JSON.stringify(Task.queue));
  }catch(err){
    console.log(err);
  }
  
  return isDeleted;
}

export default deleteById;
