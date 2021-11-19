import { Response } from 'express';
// import mongoose from 'mongoose';

export interface TaskState {
  id: string; // unique id given by kratos
  options: Record<string, unknown>; // params for running the shell script
  started: number, // record timestamp when the task is created
  logPath: string, // task log file path
  errorLogPath: string;
  shellRes?: Response // express response to stream write shell log 
  // sshClient:
}

//  task state will be saved in memory, to keep track of currently running ssh tasks
const Tasks:TaskState[] = [];

export default Tasks;
