import { _runSideEffect, runKratosTask } from '../index';

describe('Run Kratos Task', ()=>{

  it('should inject runSide Effect to taskInstruction', () => {
    const taskInstruction = jest.fn();
    const taskInstructionParams = runKratosTask(taskInstruction);
    expect(taskInstruction).toHaveBeenCalledWith(taskInstructionParams);
  });


});
