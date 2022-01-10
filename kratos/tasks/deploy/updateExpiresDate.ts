import { KratosTaskEffect } from '../../utils/kratosTask/types';
import { sleepPromise } from '../../utils/promise';

const updateExpiresDate:KratosTaskEffect = async (_params) => {
  console.log('RUN updateExpiresDate');
  // console.log(params, 'params');
  await sleepPromise(8000);
  return { updateExpiresDate: 'updateExpiresDate' };
}

export default updateExpiresDate;
