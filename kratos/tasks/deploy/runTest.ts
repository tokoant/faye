import { KratosTaskEffect } from '../../utils/kratosTask/types';
import { runKratosTask } from '../../utils/kratosTask';
import testTask from '../test';

const runTest:KratosTaskEffect = async (params) => {
  console.log('RUN EFFECT runTest');
  
  const { parentId } = params;
  
  await runKratosTask({ task: testTask, parentId });

  return { runTest: 'runTest' };
}

export default runTest;
