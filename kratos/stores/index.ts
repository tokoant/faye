// @ts-nocheck

import { createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import promise from 'redux-promise-middleware';
import createSagaMiddleware from 'redux-saga';
import fs from 'fs';

// reducers
import taskReducers, { Task } from './reducers/task';
import promiseReducers, { PromiseState } from './reducers/promise';
import sagaPromiseReducers, { SagaPromiseState } from './reducers/saga-promise';

// middlewares
import loggerMiddleware from './middlewares/logger';
import saveToDiskMiddleware, { PERMANENT_STATE_PATH } from './middlewares/saveToDisk';

export const sagaMiddleware = createSagaMiddleware();
const reducers = combineReducers({ task: taskReducers, promises: promiseReducers, sagaPromises: sagaPromiseReducers });

interface StateType {
  task: Task[],
  promises: PromiseState[],
  sagaPromises: SagaPromiseState[],
}
const recoverableState = () => {
  let savedState:StateType = {
    task: [],
    promises: [],
    sagaPromises: [],
  };

  try {
    const stateFileValue = fs.readFileSync(PERMANENT_STATE_PATH);
    savedState = JSON.parse(stateFileValue.toString());

    // TODO: handle recovery here
    // 
    // NEEDED: 
    // - order of tasks 
    // - type of the task (SSH and nonSSH)
    // 
    // HOW TO RECOVER:
    // - list all tasks and groupBy parentId
    // - executed task sequentially by it's type (SSH and nonSSH)
    //    -? for SSH task:
    //        -> redux state CREATED:
    //            - rerun the promise action from params
    //        -> redux state STARTED:
    //            - GET result from ssh server by task id 
    //                - if still running: reconnect the event listenner
    //                - else update state by id
    //        -> redux state FULFILLED: 
    //            - skip execution
    //        -> redux state REJECTED:
    //            - skip execution
    //    -? for nonSSH task:
    //        -> redux state CREATED:
    //            - rerun the promise action from params
    //        -> redux state STARTED:
    //            - rerun the promise action from params
    //        -> redux state FULFILLED: 
    //            - skip execution
    //        -> redux state REJECTED:
    //            - skip execution
    //

  }catch(err){
    fs.writeFileSync(PERMANENT_STATE_PATH, JSON.stringify(savedState));
    console.log(err);
  }
  return savedState;
}

const composeStoreWithMiddleware = applyMiddleware(
  loggerMiddleware,
  saveToDiskMiddleware,
  sagaMiddleware,
  thunk,
  promise,
)(createStore)

export default composeStoreWithMiddleware(reducers, recoverableState());
