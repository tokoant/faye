import { KratosTaskEffect } from '../../utils/kratosTask/types';
import { sleepPromise } from '../../utils/promise';

const getCloudRunConfig:KratosTaskEffect = async (_params) => {
  console.log('RUN EFFECT getCloudRunConfig');
  // console.log(params, 'params');
  await sleepPromise(6000);
  return { getCloudRunConfig: 'getCloudRunConfig' };
}

export default getCloudRunConfig;
