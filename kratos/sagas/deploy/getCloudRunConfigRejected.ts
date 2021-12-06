import { sleepPromise } from "../../utils/promise";
import mongoose from 'mongoose';

interface TaskParams {
  id: mongoose.Types.ObjectId;
}
const getCloudRunConfig = async ({ id }: TaskParams) => {
  console.log('run getCloudRunConfig');

  const interval = setInterval(()=>{
    console.log(`run getCloudRunConfig ${(new Date).getTime()}`)
  }, 1000);
  await sleepPromise(6000);
  clearInterval(interval);

  throw { id, error: new Error(`something when wrong with id ${id}`) };
}

export default getCloudRunConfig;
