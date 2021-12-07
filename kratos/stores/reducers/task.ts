import { Reducer } from 'redux';
import mongoose from 'mongoose';

type STATUS_ENUMS = 'created' | 'running' | 'ended';

interface Log {
  timestamp: number,
  type: string,
  line: string,
}
export interface Task {
  logs: Log[], 
  status: STATUS_ENUMS,
  isOk: boolean,
  isError: boolean,
  error: string,
  script: string,
  target: string,
  taskId: mongoose.Types.ObjectId,
  startedAt: string,
  endedAt: string,
}
const taskReducers:Reducer = (state, action) => {
  switch (action.type) {
    case 'task/create':
      return [...state, { something: 'task'}];
    case 'task/get':
      return state;
    default:
      return [];
  }
}

export default taskReducers;