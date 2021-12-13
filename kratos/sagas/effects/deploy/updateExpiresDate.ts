import { KratosSagaEffect } from '../../types';
import { createKratosSagaEffect } from '../../sagaEffect'; 

import { sleepPromise } from "../../../utils/promise";

const updateExpiresDate: KratosSagaEffect = async ({ id, prevTask }) => {
  console.log('run updateExpiresDate');
  console.log(prevTask, 'prev task result');

  const interval = setInterval(()=>{
    console.log(`run updateExpiresDate ${(new Date).getTime()}`)
  }, 1000);
  await sleepPromise(6000);
  clearInterval(interval);

  return { id, result: 'updateExpiresDate result' };
}

export default createKratosSagaEffect({ 
  effect: updateExpiresDate,
  partOf: 'deploySaga',
});
