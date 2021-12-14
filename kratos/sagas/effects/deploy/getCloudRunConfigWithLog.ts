import { KratosSagaEffect } from '../../types';
import { createKratosSagaEffect } from '../../sagaEffect'; 

import fs from 'fs';
import { runSshScriptWithLogStream } from '../../../utils/shellScript';

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
  await runSshScriptWithLogStream(params);

  return { id, result: params };
}

export default createKratosSagaEffect({ 
  effect: getCloudRunConfig, 
  partOf: 'deploySaga',
  useSsh: true 
});
