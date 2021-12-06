// @ts-nocheck

import stores, { sagaMiddleware } from '../stores';
import mongoose from 'mongoose';
import { putResolve, put } from 'redux-saga/effects'
import deploySaga from '../sagas/deploy';
import streamResponse from '../stores/states/streamResponse';

// Needed Features:
// - in synchronize with redux [DONE]
// - serializable tasks [DONE]
// - can stream the output log [DONE]
// - can be recovered after crash

export const runDeploySaga = (_req, res) => {

  const deployId = new mongoose.Types.ObjectId();

  // TODO: refactor this promiseActionCreator, with input of an array and output of action-promise
  const promiseActionCreator = (payload, parentId) => {

    const actionId = new mongoose.Types.ObjectId();

    const createActionPayload = {
      parentId,
      id: actionId,
      ...payload,
    }
    stores.dispatch({type: 'SAGA_PROMISE_CREATED', payload: createActionPayload });

    return ({ prevTask } = {}) => { 

      stores.dispatch({type: 'SAGA_PROMISE_STARTED', payload: { id: actionId } });

      return { 
        type: 'SAGA_PROMISE', 
        payload: deploySaga[payload.name]({ id: actionId, prevTask }),
      }

    }
  }
  const checkCloudRunManifest = promiseActionCreator({ name: 'checkCloudRunManifest', params: { gitHash: 123 }}, deployId);
  const getCloudRunConfig = promiseActionCreator({ name: 'getCloudRunConfigWithLog'}, deployId);
  const updateExpiresDate = promiseActionCreator({ name: 'updateExpiresDate', params: { featureNum: 1234 }}, deployId);

  function* runDeployGenerator() {
    const resp = yield putResolve(checkCloudRunManifest());
    yield putResolve(getCloudRunConfig({ prevTask: resp.value }));
    yield putResolve(updateExpiresDate());
  }

  sagaMiddleware.run(runDeployGenerator);

  res.json({ states: 'running deployment saga' });
}

export const getRunDeploySagaLog = (req, res) => {
  const { taskId: currentTaskId } = req.params;
    
  // check if task status is ended
  const { sagaPromises } = stores.getState();
  const task = sagaPromises.find(({ parentId }) => parentId.toString() === currentTaskId);

  if (task && task.status === 'ended'){
      res.status(200);
      res.json({info: 'task ended'});
  }else{
      streamResponse[currentTaskId] = res;

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
  }
}
