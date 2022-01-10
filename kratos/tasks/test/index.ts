import { TaskInstruction } from '../../utils/kratosTask/types';

import runCheckSomething from "./runCheckSomething";
import runTestSomething from "./runTestSomething";

const testInstruction:TaskInstruction = async (params) => {
  const { runSideEffect, context } = params;

  console.log(context, 'CONTEXT\n\n\n');

  const params1 = { someParams: 1 };
  const result1 = await runSideEffect(runCheckSomething, params1);

  const params2 = { someParams: 2, result1 };
  await runSideEffect(runTestSomething, params2);
}

export default {
  taskName: 'test',
  instruction: testInstruction,
};