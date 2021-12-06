import { Reducer } from 'redux';

const taskReducers:Reducer = (state, action) => {
  switch (action.type) {
    case 'task/create':
      return [...state, { something: 'task'}];
    case 'task/get':
      return state;
    default:
      return [];
  }
}

export default taskReducers;