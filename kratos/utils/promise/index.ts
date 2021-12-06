import serializeableTask from '../../serializable';
import stores from '../../stores';
import { createPromise, startPromise } from '../../stores/thunks/promise';
import mongoose from 'mongoose';

export const sleepPromise = (ms: number) => {
  console.log(`PROMISE OF SLEEP FOR ${ms}ms`);
  return new Promise((resolve, _reject) => {
    setTimeout(() => resolve({result: ms}), ms);
  });
};

interface ActionObjectType {
  name: string;
  params?: Record<string, string|number>
}
export const actionPromiseCreator = (actionsObj:ActionObjectType[]) => {
  
  const promiseActions= [];

  for (let index = 0; index < actionsObj.length; index++) {
    const serializableName:string = actionsObj[index].name;
    const taskParams:Record<string, string|number> =  actionsObj[index].params || {};
    const taskPromise = serializeableTask[serializableName];

    // will add created state on so it can be recover later
    const result  = stores.dispatch<any>(createPromise(serializableName, taskParams));

    // prepare promise of action to be executed by redux-promise-middleware
    promiseActions.push({
      id: result.payload.id,
      thunkName: 'PROMISE',
      payload: taskPromise
    });
  }

  return promiseActions;
}

interface PromiseActionType {
  thunkName: string;
  id: mongoose.Types.ObjectId;
  payload: ({ id }: { id: mongoose.Types.ObjectId}) => Promise<{ id: mongoose.Types.ObjectId; result: string; }>;
}
export const runActionsSequentially = async (actionPromises: PromiseActionType[]) => {

  for (let index = 0; index < actionPromises.length; index++) {
    const { thunkName, payload, id } = actionPromises[index];
    // will get an async thunk from startPromise and dispatch it one by one
    await stores.dispatch<any>(startPromise(thunkName, id, payload));
  }
}
