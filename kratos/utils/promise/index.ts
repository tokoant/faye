export const sleepPromise = (ms: number) => {
  console.log(`PROMISE OF SLEEP FOR ${ms}ms\n`);
  return new Promise((resolve, _reject) => {
    setTimeout(() => resolve({result: ms}), ms);
  });
};
