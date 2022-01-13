export const sleepPromise = (ms: number) => {
  console.log(`promise sleep for ${ms}ms`);
  return new Promise((resolve, _reject) => {
    setTimeout(() => resolve({result: ms}), ms);
  });
};
