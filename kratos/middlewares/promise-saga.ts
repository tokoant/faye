// @ts-nocheck

import stores, { sagaMiddleware } from '../stores';
import mongoose from 'mongoose';
import { putResolve, put } from 'redux-saga/effects'
import deploySaga from '../sagas/deploy';

export const runDeploySaga = (_req, res) => {

  const promiseActionCreator = (payload) => {

    const actionId = new mongoose.Types.ObjectId();

    const createActionPayload = {
      id: actionId,
      ...payload,
    }
    stores.dispatch({type: 'SAGA_PROMISE_CREATED', payload: createActionPayload });

    return () => { 

      stores.dispatch({type: 'SAGA_PROMISE_STARTED', payload: { id: actionId } });

      return { 
        type: 'SAGA_PROMISE', 
        payload: deploySaga[payload.name]({ id: actionId }),
      }

    }
  }

  const checkCloudRunManifest = promiseActionCreator({ name: 'checkCloudRunManifest', params: { gitHash: 123 }});
  const getCloudRunConfig = promiseActionCreator({ name: 'getCloudRunConfigRejected'});
  const updateExpiresDate = promiseActionCreator({ name: 'updateExpiresDate', params: { featureNum: 1234 }});

  function* runDeployGenerator() {
    yield putResolve(checkCloudRunManifest());
    yield putResolve(getCloudRunConfig());
    yield putResolve(updateExpiresDate());
  }

  sagaMiddleware.run(runDeployGenerator);

  res.json({ states: stores.getState() });
}
