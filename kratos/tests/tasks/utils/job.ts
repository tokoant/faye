
import { KratosTaskPayload } from '../../interfaces'

interface RunTestParams {
  ms: number,
}

export const runTest = (params: RunTestParams) => async (payload: KratosTaskPayload) => {
  console.log(`PROMISE OF SLEEP FOR ${params.ms}ms in ${payload.taskId}`);
  const result = new Promise((resolve, _reject) => {
    setTimeout(() => resolve(params), params.ms);
  });
  return result
  //{test:{time: 12,lintOk:true}}
};

export default runTest;
