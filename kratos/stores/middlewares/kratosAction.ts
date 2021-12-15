import { sagaMiddleware } from '../index';
import { Middleware, Dispatch } from 'redux';
import { KratosSagaAction, KratosSagaMeta, KratosSagaEffectReturn, KratosRecoveryAction } from '../../sagas/types';
import { putResolve } from 'redux-saga/effects';
import sagaEffects from '../../sagas/effects';
import mongoose from 'mongoose';

// CREATOR
const _promiseActionCreator = (dispatch:Dispatch, action:KratosSagaAction, meta: KratosSagaMeta, orderNumber: number) => {

  const { parentId } = meta;
  const { effect, useSsh } = sagaEffects[action.name];

  const actionId = new mongoose.Types.ObjectId();
  const createActionPayload = {
    parentId,
    orderNumber,
    useSsh,
    id: actionId,
    ...action,
  }
  dispatch({ type: 'SAGA_PROMISE_CREATED', payload: createActionPayload });
  
  type StartingEffectParams = { prevTask: { value: KratosSagaEffectReturn } | { value: {} } };
  const startEffect = ({ prevTask = { value: {} } }: StartingEffectParams ) => { 

    dispatch({type: 'SAGA_PROMISE_STARTED', payload: { id: actionId } });

    return {
      type: 'SAGA_PROMISE', 
      payload: effect( { parentId, id: actionId, prevTask: prevTask.value }),
    }
  };

  return startEffect;
}

interface RunPromiseActionsCreationParams {
  dispatch: Dispatch,
  actions: KratosSagaAction[],
  meta: KratosSagaMeta,
}
const _runPromiseActionsCreation = (params:RunPromiseActionsCreationParams) => {
  const { dispatch, actions, meta } = params;

  const actionPromises:any[] = [];

  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    actionPromises.push(_promiseActionCreator(dispatch, action, meta, index));
  }

  function* runActionsGenerator() {
    let prevTask:KratosSagaEffectReturn | undefined;
    for (let promiseAction of actionPromises) {
      prevTask = yield putResolve(promiseAction({ prevTask }));
    }
  }

  sagaMiddleware.run(runActionsGenerator);
}
// CREATOR




// RECOVER
const _promiseActionRecover = (dispatch:Dispatch, action:KratosRecoveryAction) => {

  const actionId = action.id;
  const parentId = action.parentId;
  const { effect } = sagaEffects[action.name];

  dispatch({ type: 'SAGA_PROMISE_TOBE_RECOVERED', payload: { id: action.id } });
  
  type StartingEffectParams = { prevTask: { value: KratosSagaEffectReturn } | { value: {} } };
  const startEffect = ({ prevTask = { value: {} } }: StartingEffectParams ) => { 

    dispatch({type: 'SAGA_PROMISE_STARTED', payload: { id: actionId } });

    return {
      type: 'SAGA_PROMISE', 
      payload: effect( { parentId, id: actionId, prevTask: prevTask.value }),
    }
  };

  return startEffect;
}

interface RunPromiseActionsRecoveryParams {
  dispatch: Dispatch,
  actions: KratosRecoveryAction[],
}
const _runPromiseActionsRecovery = (params:RunPromiseActionsRecoveryParams) => {
  const { dispatch, actions } = params;
  const actionPromises:any[] = [];

  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    actionPromises.push(_promiseActionRecover(dispatch, action));
  }

  function* runRecoveryGenerator() {
    let prevTask:KratosSagaEffectReturn | undefined;
    for (let promiseAction of actionPromises) {
      prevTask = yield putResolve(promiseAction({ prevTask }));
    }
  }

  sagaMiddleware.run(runRecoveryGenerator);
}
// RECOVER


const kratosActionMiddleware:Middleware = ({ dispatch }) => {
  return next => action => {
    
    if (action.type === 'KratosAction'){
      if (action.payload === 'PromiseActionCreator'){
        _runPromiseActionsCreation({ 
          dispatch, 
          actions: action.actions, 
          meta: action.meta 
        });
      }
      if (action.payload === 'PromiseActionRecovery'){
        _runPromiseActionsRecovery({ 
          dispatch, 
          actions: action.actions
        });
      }
    }

    // Call the next dispatch method in the middleware chain.
    const returnValue = next(action);

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue;
  }
}

export default kratosActionMiddleware;
