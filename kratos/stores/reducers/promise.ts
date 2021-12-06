import mongoose from 'mongoose';

const STORE_PATH = 'PROMISE';

type PROMISE_STATE = 'created' | 'started' | 'fulfilled' | 'rejected';
export interface PromiseState {
  id: mongoose.Types.ObjectId;
  params?: Record<string, string|number>;
  serializableName: string;
  state: PROMISE_STATE;
  result?: object;
  error?: Error;
  startedAt?: string;
  createdAt?: string;
  endedAt?: string;
}
export interface ActionType {
  type: string;
  payload: {
    id: mongoose.Types.ObjectId;
  };
}
const promiseReducers = (state:PromiseState[], action:ActionType) => {

  let currentPromise = undefined;
  let notCurrentPromise:PromiseState[] = [];

  if (action.payload){
    const { id: promiseId } = action.payload;
    currentPromise = state.find(({ id }) => id === promiseId);
    notCurrentPromise = state.filter(({ id }) => id !== promiseId);
  }

  switch (action.type) {
    case `${STORE_PATH}_CREATED`:
      return [...state, { ...action.payload }];
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
        endedAt: (new Date).toISOString(),
      };
      return [...notCurrentPromise, fulfilledPromise];
    case `${STORE_PATH}_REJECTED`:
      const rejectedPromise = {
        ...currentPromise,
        state: 'rejected',
        endedAt: (new Date).toISOString(),
      };
      return [...notCurrentPromise, rejectedPromise];
    default:
      return state || [];
  }
}

export default promiseReducers;