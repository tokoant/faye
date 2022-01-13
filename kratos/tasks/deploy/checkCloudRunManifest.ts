import { KratosTaskEffect } from '../../utils/kratosTask/types';
import { sleepPromise } from '../../utils/promise';

const checkCloudRunManifest:KratosTaskEffect = async (_params) => {
  console.log('RUN EFFECT checkCloudRunManifest');
  // console.log(params, 'params');
  await sleepPromise(10000);

  return { checkCloudRunManifest: 'checkCloudRunManifest' };
}

export default checkCloudRunManifest;
