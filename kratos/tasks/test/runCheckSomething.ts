import { KratosTaskEffect } from '../../utils/kratosTask/types';
import { sleepPromise } from '../../utils/promise';

const runCheckSomething:KratosTaskEffect = async (_params) => {
  console.log('RUN EFFECT runCheckSomething');
  // console.log(params, 'params');
  await sleepPromise(10000);

  return { runCheckSomething: 'runCheckSomething' };
}

export default runCheckSomething;
