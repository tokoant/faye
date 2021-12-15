import mongoose from 'mongoose';

const STORE_PATH = 'SSH_RUNNER';

type STATUS_ENUMS = 'created' | 'running' | 'ended';

interface Log {
  timestamp: number,
  type: string,
  line: string,
}
export interface SSHRunnerState {
  id: mongoose.Types.ObjectId,
  taskId: mongoose.Types.ObjectId,
  logs: Log[], 
  status: STATUS_ENUMS,
  error: string,
  script: string,
  target: string,
  startedAt: string,
  endedAt: string,
}

export interface ActionType {
  type: string;
  payload?: {
    id: mongoose.Types.ObjectId;
    log?: Log;
  };
}
const sshRunnerReducer = (state:SSHRunnerState[], action:ActionType) => {

  let currentRunner:SSHRunnerState | undefined = undefined;
  let notCurrentRunner:SSHRunnerState[] = [];

  if (action.payload){
    const { id: runnerId } = action.payload;
    currentRunner = state.find(({ id }) => id === runnerId);
    notCurrentRunner = state.filter(({ id }) => id !== runnerId);
  }

  switch (action.type) {
    case `${STORE_PATH}_CREATED`:
      return [...state, {
        ...action.payload,
        status: 'created',
        startedAt: (new Date()).toISOString(),
        logs: [],
      }];
    case `${STORE_PATH}_RUNNING`:
      if (!currentRunner) {
        return [...state];
      }else{
        const currentRunningTask = {
          ...currentRunner,
          status: 'running',
        }
        // if (action.payload.log) currentRunningTask.logs.push(action.payload.log);
        return [...notCurrentRunner, currentRunningTask];
      }
    case `${STORE_PATH}_ENDED`:
      const resolvedRunner = {
        ...currentRunner,
        status: 'ended',
        isOk: true,
        isError: false,
        endedAt: (new Date()).toISOString(),
      };
      return [...notCurrentRunner, resolvedRunner];
    case `${STORE_PATH}_REMOVE`: 
      return [...notCurrentRunner];
    case `${STORE_PATH}_RESET`: 
      return [];
    default:
      return state || [];
  }
}


export default sshRunnerReducer;