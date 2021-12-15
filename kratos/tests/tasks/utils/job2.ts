import { KratosTaskPayload } from '../interfaces'


interface RunTestParams {
  ms: number,
}

export const runTest = (params: RunTestParams) => async(payload: KratosTaskPayload) => {
  console.log(`PROMISE OF SLEEP FOR ${params.ms}ms in ${payload.taskId}`);
  return new Promise((resolve, _reject) => {
    setTimeout(() => resolve({result: params}), params.ms);
  });
};

export default runTest;
