import { runKratosTask } from '../index';

describe('Run Kratos Task', ()=>{

  it('should inject runSide Effect to taskInstruction', async () => {
    const taskInstruction = jest.fn();

    const kratosTask = { task: {
      taskName: 'deploy',
      instruction: taskInstruction
    } }

    const taskInstructionParams = await runKratosTask(kratosTask);
    expect(taskInstruction).toHaveBeenCalledWith(taskInstructionParams);
  });

});
