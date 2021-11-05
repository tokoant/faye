import { TaskState } from '../index';

const findById = (id:number) => {
  const Task = global.faye?.Task;

  return Task.queue.find((n:TaskState) => n.id === id);
}

export default findById;
