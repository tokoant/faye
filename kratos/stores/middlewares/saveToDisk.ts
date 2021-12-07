import { Middleware } from 'redux';
import fs from 'fs';

export const PERMANENT_STATE_PATH  = `./records/permanent.state`;

const saveToDiskMiddleware:Middleware = ({ getState }) => {
  return next => action => {

    // Call the next dispatch method in the middleware chain.
    const returnValue = next(action)

    fs.writeFileSync(PERMANENT_STATE_PATH, JSON.stringify(getState()));

    console.log(`saving to disk on ${PERMANENT_STATE_PATH}`)
    // console.log('state after dispatch', getState())

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue;
  }
}

export default saveToDiskMiddleware;