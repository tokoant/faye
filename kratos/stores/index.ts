// @ts-nocheck

import { createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import promise from 'redux-promise-middleware';
import createSagaMiddleware from 'redux-saga';
import fs from 'fs';
import { groupBy, orderBy, uniq } from 'lodash';
import { sleepPromise } from '../utils/promise';

// reducers
import sshRunnerReducer, { SSHRunnerState } from './reducers/ssh-runner';
import sagaPromiseReducer, { SagaPromiseState } from './reducers/saga-promise';

// middlewares
import loggerMiddleware from './middlewares/logger';
import kratosActionMiddleware from './middlewares/kratosAction';
import saveToDiskMiddleware, { PERMANENT_STATE_PATH } from './middlewares/saveToDisk';

export const sagaMiddleware = createSagaMiddleware();
const reducers = combineReducers({ sshRunners: sshRunnerReducer, sagaPromises: sagaPromiseReducer });


const _recoverKratosTask = async (taskStateFromDrive: StateType) => {

  const { sshRunners } = taskStateFromDrive;

  await sleepPromise(1000);
  
  // CLEAN UP
  // get all ssh-runner with status === 'running'
  const runningSshRunners = sshRunners.filter(({ status }) => status === 'running');
  // TODO: send kill signal to faye (sshConnServer)
  // remove old ssh-runner & remark it saga-promise state 'to-be-recovered'
  for (let index = 0; index < runningSshRunners.length; index++) {
    const runningSshRunner:SSHRunnerState = runningSshRunners[index];
    reduxStore.dispatch({ type: 'SSH_RUNNER_REMOVE', payload: { id: runningSshRunner.id } });
    reduxStore.dispatch({ type: 'SAGA_PROMISE_TOBE_RECOVERED', payload: { id: runningSshRunner.taskId }})
  }

  // RECOVER
  const { sagaPromises } = reduxStore.getState();
  // get all saga-promise with state created or started or to-be-recovered
  const recoverableSagaPromise = sagaPromises.filter(({ state }) => state === 'created' || state === 'started' || state === 'tobe-recovered');
  // reduce its parents & fill all parents with it actions
  const parentIds:string[] = uniq(recoverableSagaPromise.map(({ parentId }) => parentId ));
  for (let index = 0; index < parentIds.length; index++) {
    const pointedParentId = parentIds[index];
    const fullSagaPromises = orderBy(sagaPromises.filter(({ parentId }) => parentId === pointedParentId), ['orderNumber'], ['asc']);
    const recoverActions = [];
    
    for (let jndex = 0; jndex < fullSagaPromises.length; jndex++) {
      const fullSagaPromise = fullSagaPromises[jndex];
      recoverActions.push({
        name: fullSagaPromise.name,
        id: fullSagaPromise.id,
        parentId: fullSagaPromise.parentId,
      })
    }

    reduxStore.dispatch<KratosActionCreatorParams>({ 
      type: 'KratosAction', 
      payload: 'PromiseActionRecovery',
      actions: recoverActions,
    });

  }

}

interface StateType {
  sshRunners: SSHRunnerState[],
  sagaPromises: SagaPromiseState[],
}
const recoverableState = () => {
  let savedState:StateType = {
    sshRunners: [],
    sagaPromises: [],
  };

  try {
    const stateFileValue = fs.readFileSync(PERMANENT_STATE_PATH);
    savedState = JSON.parse(stateFileValue.toString());

    _recoverKratosTask(savedState);

  }catch(err){
    fs.writeFileSync(PERMANENT_STATE_PATH, JSON.stringify(savedState));
    console.log(err);
  }
  return savedState;
}

const composeStoreWithMiddleware = applyMiddleware(
  loggerMiddleware,
  kratosActionMiddleware,
  saveToDiskMiddleware,
  sagaMiddleware,
  thunk,
  promise,
)(createStore)

const reduxStore = composeStoreWithMiddleware(reducers, recoverableState());

export default reduxStore;
