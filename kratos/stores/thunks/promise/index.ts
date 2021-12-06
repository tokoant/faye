import { PromiseState } from '../../reducers/promise';
import mongoose from 'mongoose';

export const createPromise = (serializableName:string, params:Record<string, string|number>) => {

  const createPayload:PromiseState = {
    id: new mongoose.Types.ObjectId(),
    serializableName,
    state: 'created',
    params,
    createdAt: (new Date()).toISOString(),
  }

  return { 
    type: 'PROMISE_CREATED', 
    payload: () => createPayload,
  }
};

// will dispatch start action and prepare an async thunk promise payload
type PromiseActionType = ({ id }: {id: mongoose.Types.ObjectId}) => Promise<{ id: mongoose.Types.ObjectId; result: string; }>;
export const startPromise = (thunkName: string, id: mongoose.Types.ObjectId, promiseAction: PromiseActionType) => {
  const startPromiseThunk = async (dispatch:any, _getState:any) => {
    dispatch({ type: 'PROMISE_STARTED', payload: { id } });
    await dispatch({
      type: thunkName,
      payload: promiseAction({ id }),
    });
  }
  return startPromiseThunk;
}
