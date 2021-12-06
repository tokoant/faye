import mongoose from 'mongoose';

const STORE_PATH = 'SAGA_PROMISE';

type PROMISE_STATE = 'created' | 'started' | 'fulfilled' | 'rejected';
export interface PromiseState {
  parentId: mongoose.Types.ObjectId;
  id: mongoose.Types.ObjectId;
  params?: Record<string, string|number>;
  name: string;
  state: PROMISE_STATE;
  result?: object;
  error?: Error;
  startedAt?: string;
  createdAt?: string;
  endedAt?: string;
}
export interface ActionType {
  type: string;
  error: boolean;
  payload: {
    id: mongoose.Types.ObjectId;
    result?: object;
    error?: Error;
  };
}
const sagaPromiseReducers = (state:PromiseState[], action:ActionType) => {

  let currentPromise = undefined;
  let notCurrentPromise:PromiseState[] = [];

  if (action.payload){
    const { id: promiseId } = action.payload;
    currentPromise = state.find(({ id }) => id === promiseId);
    notCurrentPromise = state.filter(({ id }) => id !== promiseId);
  }

  switch (action.type) {
    case `${STORE_PATH}_CREATED`:
      return [...state, { 
        ...action.payload, 
        state: 'created',
        createdAt: (new Date).toISOString(),
      }];
    case `${STORE_PATH}_STARTED`:
      const statedPromise = {
        ...currentPromise,
        state: 'started',
      };
      return [...notCurrentPromise, statedPromise];
    case `${STORE_PATH}_FULFILLED`:
      const fulfilledPromise = {
        ...currentPromise,
        state: 'fulfilled',
        result: action.payload.result,
        endedAt: (new Date).toISOString(),
      };
      return [...notCurrentPromise, fulfilledPromise];
    case `${STORE_PATH}_REJECTED`:
      const rejectedPromise = {
        ...currentPromise,
        state: 'rejected',
        error: action.payload.error,
        endedAt: (new Date).toISOString(),
      };
      return [...notCurrentPromise, rejectedPromise];
    default:
      return state || [];
  }
}

export default sagaPromiseReducers;