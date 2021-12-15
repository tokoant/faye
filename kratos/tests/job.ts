import mongoose from 'mongoose'

interface KratosTaskPayload<paramsType> {
  params: paramsType;
  logHelper: any;
  taskId: mongoose.Types.ObjectId;
}

interface RunTestParams {
  ms: number,
}

export const runTest = (payload: KratosTaskPayload<RunTestParams>) => {
  const { params } = payload;
  console.log(`PROMISE OF SLEEP FOR ${params.ms}ms`);
  return new Promise((resolve, _reject) => {
    setTimeout(() => resolve({result: params}), params.ms);
  });
};

export default runTest;
