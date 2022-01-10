export type RunKratosTaskContext = Record<string, any>;

// typing for effects / jobs / sub-tasks 
export type KratosTaskEffectReturn = Promise<unknown>;
export type KratosTaskEffect = (params: Record<string, any>) => KratosTaskEffectReturn;


// typing for run kratos task effect
export type RunKratosTaskEffect = (effect:KratosTaskEffect, params?: Record<string, unknown>) => KratosTaskEffectReturn;


// typing for instructions / function passed to run kratos task
export interface TaskInstructionParams {
  context: RunKratosTaskContext,
  runSideEffect: RunKratosTaskEffect,
} 
export type TaskInstruction = (params: TaskInstructionParams) => Promise<void>;
export type KratosTask = { taskName: string, instruction:TaskInstruction};
export interface RunKratosTaskParams {
  task: KratosTask,
  parentId?: string,
  recoverableTaskId?: string,
}
export type RunKratosTask = (params: RunKratosTaskParams) => Promise<TaskInstructionParams>;


// stored effect / jobs
export interface EffectInfo {
  name: string,
  params: Record<string, unknown>,
  result?: unknown
}
