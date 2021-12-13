import { KratosSagaEffect } from '../../types';
import { createKratosSagaEffect } from '../../sagaEffect'; 

import { sleepPromise } from "../../../utils/promise";

const getCloudRunConfig: KratosSagaEffect = async ({ id, prevTask }) => {
  console.log('run getCloudRunConfig');
  console.log(`after prev task with id: ${prevTask.id} and result: ${prevTask.result}`);

  const interval = setInterval(()=>{
    console.log(`run getCloudRunConfig ${(new Date).getTime()}`);
  }, 1000);
  await sleepPromise(6000);
  clearInterval(interval);

  return { id, result: 'getCloudRunConfig result' };
}

export default createKratosSagaEffect({ 
  effect: getCloudRunConfig,
  partOf: 'deploySaga', 
});
