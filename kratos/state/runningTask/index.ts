import { createStore } from 'redux';
import fs from 'fs';

const RUNNING_TASK_PATH  = './records/running-task.state';

interface RunningTask {
  value: number
}

const recoverableState =  () => {
  let savedState:RunningTask = {
    value: 0,
  };
  try {
    const stateFileValue = fs.readFileSync(RUNNING_TASK_PATH);
    savedState = JSON.parse(stateFileValue.toString());
  }catch(err){
    console.log(err);
  }
  return savedState;
}

function reducers(state = recoverableState(), action: { type: string }) {
  switch (action.type) {
    case 'runningTask/incremented':
      return { value: state.value + 1 };
    case 'runningTask/decremented':
      return { value: state.value - 1 };
    default:
      return state;
  }
}

export const runningTaskStore = createStore(reducers);

export const saveStateToFile = (data:any) => {
  fs.writeFileSync(RUNNING_TASK_PATH, JSON.stringify(data));
};
