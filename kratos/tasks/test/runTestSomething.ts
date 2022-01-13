import { KratosTaskEffect } from '../../utils/kratosTask/types';
import { sleepPromise } from '../../utils/promise';

const runTestSomething:KratosTaskEffect = async (_params) => {
  console.log('RUN EFFECT runTestSomething');
  // console.log(params, 'params');
  await sleepPromise(10000);

  return { runTestSomething: 'runTestSomething' };
}

export default runTestSomething;
