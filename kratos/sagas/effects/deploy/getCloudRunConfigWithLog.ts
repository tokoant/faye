import { KratosSagaEffect } from '../../types';
import { createKratosSagaEffect } from '../../sagaEffect'; 

// import mongoose from 'mongoose';
import fs from 'fs';
import { runSshScriptWithLogStream } from '../../../utils/shellScript';
// import { runShellScript, getRunningScriptLiveLog } from '../../utils/shellScript/sshConn';
// import { kratosLogHelper } from '../../utils/logHelper';
// import streamResponse from '../../stores/states/streamResponse';

const promiseFs = fs.promises;

const getCloudRunConfig:KratosSagaEffect = async ({ parentId, id, prevTask }) => {
  console.log('run getCloudRunConfig');
  console.log(`after prev task with id: ${prevTask.id} and result: ${prevTask.result}`);

  const shellScript = (await promiseFs.readFile(`${__dirname}/../../../scripts/slow.sh`)).toString();

  const params = {
      parentId,
      taskId: id,
      target: '127.0.0.1', 
      script: shellScript,
  };
  const logStream = runSshScriptWithLogStream(params);
  console.log(logStream);
  return { id, result: 'getCloudRunConfig result' };
}

export default createKratosSagaEffect({ 
  effect: getCloudRunConfig, 
  partOf: 'deploySaga',
  useSsh: true 
});
