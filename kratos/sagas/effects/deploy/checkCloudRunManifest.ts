import { KratosSagaEffect } from '../../types';
import { createKratosSagaEffect } from '../../sagaEffect'; 

import { sleepPromise } from "../../../utils/promise";

const checkCloudRunManifest: KratosSagaEffect = async ({ id, prevTask }) => {
  console.log('run checkCloudRunManifest');
  console.log(prevTask, 'prev task result');

  const interval = setInterval(()=>{
    console.log(`run checkCloudRunManifest ${(new Date).getTime()}`)
  }, 1000);
  await sleepPromise(6000);
  clearInterval(interval);

  return { id, result: 'checkCloudRunManifest result' };
}

export default createKratosSagaEffect({ 
  effect: checkCloudRunManifest,
  partOf: 'deploySaga', 
});
