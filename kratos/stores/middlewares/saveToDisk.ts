import { Middleware } from 'redux';
import fs from 'fs';

export const PERMANENT_STATE_PATH  = `./records/permanent.state`;

const saveToDiskMiddleware:Middleware = ({ getState }) => {
  return next => action => {

    const returnValue = next(action)

    fs.writeFileSync(PERMANENT_STATE_PATH, JSON.stringify(getState()));

    console.log(`saving to disk on ${PERMANENT_STATE_PATH}`);

    return returnValue;
  }
}

export default saveToDiskMiddleware;