import SSH2Promise from 'ssh2-promise';

type STATUS_ENUMS = 'created' | 'running' | 'ended';

export interface TaskState {
  id: string; // unique id given by kratos
  options: Record<string, unknown>; // params for running the shell script
  started: number, // record timestamp when the task is created
  logPath: string, // task log file path
  status: STATUS_ENUMS,
  sshClient?: SSH2Promise
}

//  task state will be saved in memory, to keep track of currently running ssh tasks
const Tasks:TaskState[] = [];

export default Tasks;
