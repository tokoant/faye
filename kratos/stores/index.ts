import { createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import promise from 'redux-promise-middleware';

// reducers
import taskReducers from './reducers/task';
import promiseReducers from './reducers/promise';

// middlewares
import loggerMiddleware from './middlewares/logger';


const reducers = combineReducers({ task: taskReducers, promises: promiseReducers });

const composeStoreWithMiddleware = applyMiddleware(
  loggerMiddleware,
  thunk,
  promise,
)(createStore)

export default composeStoreWithMiddleware(reducers);
