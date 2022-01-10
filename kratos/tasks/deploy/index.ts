import { TaskInstruction } from '../../utils/kratosTask/types';

import checkCloudRunManifest from "./checkCloudRunManifest";
import getCloudRunConfig from "./getCloudRunConfig";
import updateExpiresDate from "./updateExpiresDate";
import runTest from './runTest';

const deployInstruction:TaskInstruction = async (params) => {
  const { runSideEffect, context } = params;

  try{
    console.log(context, 'CONTEXT\n\n\n');

    const params1 = { someParams: 1 };
    const result1 = await runSideEffect(checkCloudRunManifest, params1);
    
    const paramsWithParentId = {
      parentId: context.taskId.toString(),
    }
    await runSideEffect(runTest, paramsWithParentId);
  
    const params2 = { someParams: 2, result1 };
    const result2 = await runSideEffect(getCloudRunConfig, params2);
  
    const params3 = { someParams: 3, result2 };
    await runSideEffect(updateExpiresDate, params3);
  }catch(error){
    console.error(error)
  }

}

export default {
  taskName: 'deploy',
  instruction: deployInstruction,
};