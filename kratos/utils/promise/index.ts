export const sleepPromise = (ms: number) => {
  console.log(`PROMISE OF SLEEP FOR ${ms}ms`);
  return new Promise((resolve, _reject) => {
    setTimeout(() => resolve({result: ms}), ms);
  });
};
