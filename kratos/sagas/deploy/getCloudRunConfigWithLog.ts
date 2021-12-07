import mongoose from 'mongoose';
import fs from 'fs';
import { runShellScript, getRunningScriptLiveLog } from '../../sshConn';
import streamResponse from '../../stores/states/streamResponse';

const promiseFs = fs.promises;

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

  const shellScript = (await promiseFs.readFile(`${__dirname}/../../scripts/slow.sh`)).toString();

  const taskId = id;

  const SSEhandler = await getRunningScriptLiveLog({ taskId });
  SSEhandler.addEventListener('shell-log', (event)=>{
      if (streamResponse[taskId.toString()]) {
          streamResponse[taskId.toString()].write('event:kratos-shell-log\n');
          streamResponse[taskId.toString()].write(`data:${event.data}\n\n`);
      }
  });
  SSEhandler.addEventListener('shell-exec-end', ()=>{
      if (streamResponse[taskId.toString()]){
          streamResponse[taskId.toString()].end();
      }
  });

  const params = {
      taskId,
      target: '127.0.0.1', 
      script: shellScript,
  };

  await runShellScript(params);

  return { id, result: 'getCloudRunConfig result' };
}

export default getCloudRunConfig;
