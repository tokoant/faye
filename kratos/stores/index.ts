import { createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import promise from 'redux-promise-middleware';
import createSagaMiddleware from 'redux-saga'

// reducers
import taskReducers from './reducers/task';
import promiseReducers from './reducers/promise';
import sagaPromiseReducers from './reducers/saga-promise';

// middlewares
import loggerMiddleware from './middlewares/logger';

export const sagaMiddleware = createSagaMiddleware();
const reducers = combineReducers({ task: taskReducers, promises: promiseReducers, sagaPromises: sagaPromiseReducers });

const composeStoreWithMiddleware = applyMiddleware(
  loggerMiddleware,
  sagaMiddleware,
  thunk,
  promise,
)(createStore)

export default composeStoreWithMiddleware(reducers);
