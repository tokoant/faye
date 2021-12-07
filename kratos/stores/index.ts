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
