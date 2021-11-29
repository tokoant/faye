import { createStore, Reducer } from 'redux';
import mongoose from 'mongoose';
import fs from 'fs';
import { getRunnningScript, getRunningScriptLiveLog } from '../../sshConn';
import streamResponse from '../../state/streamResponse';

const RUNNING_TASK_PATH  = './records/running-task.state';

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

interface SSHConnectionTaskState {
  id: string; // unique id given by kratos
  options: Record<string, unknown>; // params for running the shell script
  started: number, // record timestamp when the task is created
  logPath: string, // task log file path
  status: STATUS_ENUMS,
  shellRes?: Response // express response to stream write shell log 
}

interface ErrorType {
  response: {
    data: {
      error: {
        reason: string;
      }
    }
  }
}
const _isErrorNoTask = (error: ErrorType, taskId: string) => {
  if (error.response?.data?.error?.reason === 'there no running task with that id'){
    //remove task
    taskStore.dispatch({ type: 'task/remove', payload: { taskId }});
  }
}
const _recoverRunningTaskListeners = async (runningTasks:Task[]) => {
  for (let index = 0; index < runningTasks.length; index++) {
    const task = runningTasks[index];
    try {
      const { data }: { data: SSHConnectionTaskState } = await getRunnningScript({ taskId: task.taskId.toString() });
      if (data && data.status === 'running'){
        const SSEhandler = await getRunningScriptLiveLog({ taskId: task.taskId });
        SSEhandler.addEventListener('shell-log', (event)=>{
            if (streamResponse[task.taskId.toString()]) {
                streamResponse[task.taskId.toString()].write('event:kratos-shell-log\n');
                streamResponse[task.taskId.toString()].write(`data:${event.data}\n\n`);
            }
    
            // save current running state as task stream back the log 
            taskStore.dispatch({ type: 'task/running', payload: { taskId: task.taskId, log: event.data }});
        });
        SSEhandler.addEventListener('shell-exec-end', ()=>{
            if (streamResponse[task.taskId.toString()]){
                streamResponse[task.taskId.toString()].end();
            }
    
            // resolve current task as shell execution give a finished signal 
            taskStore.dispatch({ type: 'task/resolved', payload: { taskId: task.taskId }});
        });
      }
      if (data && data.status === 'ended'){
        taskStore.dispatch({ type: 'task/resolved-with-log', payload: { taskId: task.taskId }});
      }
    } catch (error) {
      _isErrorNoTask(<ErrorType>error, task.taskId.toString());
    }
  }
}

const recoverableState = () => {
  let savedState:Task[] = [];
  try {
    const stateFileValue = fs.readFileSync(RUNNING_TASK_PATH);
    savedState = JSON.parse(stateFileValue.toString());

    // TODO: sync with faye (for all running task by id) update the state
    const runningSavedState = savedState.filter(({ status }) => status === 'running');
    _recoverRunningTaskListeners(runningSavedState);

    // TODO: handle edge case where task status is "created"
    
  }catch(err){
    saveStateToFile([]);
    console.log(err);
  }
  return savedState;
}

const saveStateToFile = (data:any) => {
  fs.writeFileSync(RUNNING_TASK_PATH, JSON.stringify(data));
};

interface ActionType {
  type: string;
  payload?: {
    taskId: mongoose.Types.ObjectId;
    log: Log;
  }
}
const reducers:Reducer = (state:Task[], action:ActionType) => {

  if (!action.payload?.taskId) return [...state];
  
  const { taskId: currentTaskId } = action.payload;
  const currentTask = state.find(({ taskId }) => taskId.toString() === currentTaskId.toString());
  
  switch (action.type) {
    case 'task/create':
      const addedState = [...state, {
        ...action.payload,
        status: 'created',
        startedAt: (new Date()).toISOString(),
      }];
      saveStateToFile(addedState);
      return addedState;
    case 'task/running':
      const otherThanCurrentRunningTaskState = state.filter(({ taskId }) => taskId.toString() !== currentTaskId.toString());
      if (currentTask){
        const currentRunningTask = {
          ...currentTask,
          status: 'running',
        }
        if (!currentRunningTask.logs) currentRunningTask.logs = [];
        currentRunningTask.logs.push(action.payload.log);
        const currentState = [...otherThanCurrentRunningTaskState, currentRunningTask];
        saveStateToFile(currentState);
        return currentState;
      }
      return [...state];
    case 'task/rejected':
      const rejectedState = [...state.filter(({ taskId }) => taskId.toString() !== currentTaskId.toString()), {
        ...currentTask,
        status: 'ended',
        isOk: true,
        isError: false,
        endedAt: (new Date()).toISOString(),
      }];
      saveStateToFile(rejectedState);
      return rejectedState;
    case 'task/resolved':
      const resolvedState = [...state.filter(({ taskId }) => taskId.toString() !== currentTaskId.toString()), {
        ...currentTask,
        status: 'ended',
        isOk: true,
        isError: false,
        endedAt: (new Date()).toISOString(),
      }];
      saveStateToFile(resolvedState);
      return resolvedState;
    case 'task/resolved-with-log':
      const resolvedWithLogState = [...state.filter(({ taskId }) => taskId.toString() !== currentTaskId.toString()), {
        ...currentTask,
        status: 'ended',
        isOk: true,
        isError: false,
        endedAt: (new Date()).toISOString(),
      }];
      saveStateToFile(resolvedWithLogState);
      return resolvedWithLogState;
    case 'task/remove': 
      const otherState = [...state.filter(({ taskId }) => taskId.toString() !== currentTaskId.toString())]
      saveStateToFile(otherState);
      return otherState;
    default:
      return [...state];
  }
}

export const taskStore = createStore(reducers, recoverableState());
