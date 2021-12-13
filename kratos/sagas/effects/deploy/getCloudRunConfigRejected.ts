import { KratosSagaEffect } from '../../types';
import { createKratosSagaEffect } from '../../sagaEffect'; 

import { sleepPromise } from "../../../utils/promise";

const getCloudRunConfig: KratosSagaEffect = async ({ id }) => {
  console.log('run getCloudRunConfig');

  const interval = setInterval(()=>{
    console.log(`run getCloudRunConfig ${(new Date).getTime()}`)
  }, 1000);
  await sleepPromise(6000);
  clearInterval(interval);

  throw { id, error: new Error(`something when wrong with id ${id}`) };
}

export default createKratosSagaEffect({ 
  effect: getCloudRunConfig,
  partOf: 'deploySaga', 
});