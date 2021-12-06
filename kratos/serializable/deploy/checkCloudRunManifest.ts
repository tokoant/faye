import { sleepPromise } from "../../utils/promise";
import mongoose from 'mongoose';

interface TaskParams {
  id: mongoose.Types.ObjectId;
}
const checkCloudRunManifest = async ({ id }: TaskParams) => {
  console.log('run checkCloudRunManifest');

  const interval = setInterval(()=>{
    console.log(`run checkCloudRunManifest ${(new Date).getTime()}`)
  }, 1000);
  await sleepPromise(10000);
  clearInterval(interval);

  return { id, result: 'checkCloudRunManifest result' };
}

export default checkCloudRunManifest;
