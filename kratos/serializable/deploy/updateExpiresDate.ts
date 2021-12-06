import { sleepPromise } from "../../utils/promise";
import mongoose from 'mongoose';

interface TaskParams {
  id: mongoose.Types.ObjectId;
}
const updateExpiresDate = async ({ id }: TaskParams) => {
  console.log('run updateExpiresDate');

  const interval = setInterval(()=>{
    console.log(`run updateExpiresDate ${(new Date).getTime()}`)
  }, 1000);
  await sleepPromise(10000);
  clearInterval(interval);

  return { id, result: 'updateExpiresDate result' };
}

export default updateExpiresDate;
