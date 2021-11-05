import reducers from "./reducers";

/* Notes:
  - no need for status, since it will just run immediately after it created and deleted after it consumed by kratos;
*/
export interface TaskState {
  id: number, // unique id given by kratos
  options: object; // params for running the shell script
  started: number, // record timestamp when the task is created
  logPath: string, 
}

const queue:TaskState[] = [];

const Task = {
  queue,
  ...reducers,
}

export default Task;
