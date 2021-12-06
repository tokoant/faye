import { sleepPromise } from "../../utils/promise";
import mongoose from 'mongoose';

interface TaskParams {
  id: mongoose.Types.ObjectId;
  prevTask: {
    id: mongoose.Types.ObjectId;
    result: string;
  };
}
const getCloudRunConfig = async ({ id, prevTask }: TaskParams) => {
  console.log('run getCloudRunConfig');
  console.log(`after prev task with id: ${prevTask.id} and result: ${prevTask.result}`);

  const interval = setInterval(()=>{
    console.log(`run getCloudRunConfig ${(new Date).getTime()}`);
  }, 1000);
  await sleepPromise(6000);
  clearInterval(interval);

  return { id, result: 'getCloudRunConfig result' };
}

export default getCloudRunConfig;
