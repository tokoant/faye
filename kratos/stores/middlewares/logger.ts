import { Middleware } from 'redux';

const loggerMiddleware:Middleware = () => {
  return next => action => {
    console.log('will dispatch', action)

    const returnValue = next(action)

    // console.log('state after dispatch', getState())

    return returnValue;
  }
}

export default loggerMiddleware;
