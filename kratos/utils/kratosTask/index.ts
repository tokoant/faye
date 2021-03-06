import mongoose from 'mongoose';
import fs from 'fs';

import { RunKratosTask, RunKratosTaskEffect, RunKratosTaskContext, EffectInfo } from './types';
import { isAsyncFunc, isSerializable } from '../checkers';

import runableKratosTask from './../../tasks';

// runKratosTask:
//  Injects instance of runSideEffect into kratos task [DONE]
//  can take cache value as a param to skip quickly
//  throws on mismatch between cache and given params

// runSideEffect:
//  can track usage of async/callback [Antoni notes -> can be checked by TS]
//  can store result of invocations internally (distinguish between of reslve or reject)
//  throws on non serializable result, or params [OK]

interface TaskStateObject {
  status: 'started' | 'running' | 'finished',
  effects: EffectInfo[],
  isError: boolean,
  parentId?: string,
  error?: string, 
  taskName: string, 
} 
type TaskState = Record<string, TaskStateObject>;
const tasksStates: TaskState = {};

type StepPointers = Record<string, number>;
const stepPointers:StepPointers = {};

export const PERMANENT_EFFECT_PATH  = `./records/permanent.effect`;

export const _storeEffectInformation = (taskId:string, effectInfo: EffectInfo) => {
  if (tasksStates[taskId]) {
    tasksStates[taskId].effects.push(effectInfo);
    fs.writeFileSync(PERMANENT_EFFECT_PATH, JSON.stringify(tasksStates));
    // console.dir(tasksStates, { depth: null });
  }
}

export const _storeEffectInformationByPointer = (taskId:string, pointer:number, effectInfo: EffectInfo) => {
  if (tasksStates[taskId]) {
    tasksStates[taskId].effects[pointer] = effectInfo;
    fs.writeFileSync(PERMANENT_EFFECT_PATH, JSON.stringify(tasksStates));
    // console.dir(tasksStates, { depth: null });
  }
}

export const _storeTaskInformationByTaskId = (taskId: string, taskInfo: TaskStateObject) => {
  if (tasksStates[taskId]) {
    tasksStates[taskId] = taskInfo;
    fs.writeFileSync(PERMANENT_EFFECT_PATH, JSON.stringify(tasksStates));
    // console.dir(tasksStates, { depth: null });
  }
}

export const _contextifyRunSideEffect = (taskId: mongoose.Types.ObjectId):RunKratosTaskEffect => {

  const STR_TASK_ID = taskId.toString();

  // initialize pointers;
  stepPointers[STR_TASK_ID] = 0;

  if (tasksStates[STR_TASK_ID]) tasksStates[STR_TASK_ID].status = 'running'; 

  _storeTaskInformationByTaskId(STR_TASK_ID, tasksStates[STR_TASK_ID]);

  const _runSideEffect:RunKratosTaskEffect = async (effect, params = {}) => {

    // check if effect is an async function
    if (!isAsyncFunc(effect)) throw new Error('params effect should be an async function'); 
  
    // check if params is serializable
    if(!isSerializable(params)) throw new Error('can only passed serializable params to run kratos side effect');
  
    let result;

    // this only happen when in recovery mode
    if (tasksStates[STR_TASK_ID] && tasksStates[STR_TASK_ID].effects.length > stepPointers[STR_TASK_ID]){
      const effectInfo = tasksStates[STR_TASK_ID].effects[stepPointers[STR_TASK_ID]];
      console.log(`RECOVERY ${effectInfo.name}`);

      if (effectInfo.params && effectInfo.result){
        console.log(`SKIPPING ${effectInfo.name}, because already have result saved\n`)
        result = effectInfo.result;
      }else{
        result = await effect(params);
        effectInfo.result = result;
        console.log(`FINISHED EFFECT ${effect.name}, and storing the result\n`);
      }

      _storeEffectInformationByPointer(STR_TASK_ID, stepPointers[STR_TASK_ID], effectInfo);
      stepPointers[STR_TASK_ID] = stepPointers[STR_TASK_ID] + 1;

    }else{
      const effectInfo: EffectInfo = {
        name: effect.name,
        params,
      }
  
      _storeEffectInformation(STR_TASK_ID, effectInfo);
    
      try {
        result = await effect(params);
  
        effectInfo.result = result;
        console.log(`FINISHED EFFECT ${effect.name}, and storing the result\n`);
        _storeEffectInformationByPointer(STR_TASK_ID, stepPointers[STR_TASK_ID], effectInfo);
        stepPointers[STR_TASK_ID] = stepPointers[STR_TASK_ID] + 1;
  
      } catch (error) {
        console.error(error);
      }
    }

    return result;
  }

  return _runSideEffect;
}

export const runKratosTask:RunKratosTask = async (params) => {

  const { task: kratosTask, parentId, recoverableTaskId } = params;

  // create a context object
  const context:RunKratosTaskContext = {};

  // find branch recoverable task id
  let recoverableBranchTaskId;
  if (parentId){
    for (const key in tasksStates) {
      if (tasksStates[key].status === 'running' && tasksStates[key].parentId === parentId && tasksStates[key].taskName === kratosTask.taskName){
        recoverableBranchTaskId = key;
      }
    }
  }

  // create task Id
  const taskId = new mongoose.Types.ObjectId(recoverableTaskId || recoverableBranchTaskId);
  const STR_TASK_ID = taskId.toString();
  context.taskId = taskId;

  // initialize task spesific states if not in recovery mode
  if(!(recoverableTaskId || recoverableBranchTaskId)){
    tasksStates[STR_TASK_ID] = {
      status: 'started',
      isError: false,
      effects: [],
      taskName: kratosTask.taskName,
    };
  }

  // assign parent id if any
  if (parentId) {
    tasksStates[STR_TASK_ID].parentId = parentId;
  }

  // run task with context:
  // console.log(taskId, 'CONGEX')
  // console.dir(tasksStates);
  const instructionParams = { context, runSideEffect: _contextifyRunSideEffect(taskId) };

  const currentTask = tasksStates[taskId.toString()];

  try {
    console.log(`\n\nRUNNING ${kratosTask.taskName} with taskID: ${taskId}\n`);
    await kratosTask.instruction(instructionParams);
  } catch (error) {
    currentTask.isError = true;
    currentTask.error = 'error running instruction';
    console.error(error);
  } finally {
    currentTask.status = 'finished';
    console.log(`Finished Task ${kratosTask.taskName} : ${STR_TASK_ID}\n`);
  }

  _storeTaskInformationByTaskId(taskId.toString(), currentTask);

  return instructionParams;
}

export const recoverKratosTaskOnStart = async () => {

  // read from file
  const dataFromFile = JSON.parse(fs.readFileSync(PERMANENT_EFFECT_PATH).toString('utf-8'));

  const unfinishedTasks = [];

  for (const key in dataFromFile) {
    const task = dataFromFile[key];

    // write back to state 
    tasksStates[key] = task;

    // filter out unfinished task with no parent
    if (task.status !== 'finished' && task.parentId === undefined){
      unfinishedTasks.push({ ...task, id: key });
    }
  }

  if (unfinishedTasks.length > 0) {
    console.log('Unfinished Task Recovery:\n');
    console.dir(unfinishedTasks);
  }

  for (let index = 0; index < unfinishedTasks.length; index++) {
    const unfinishedTask = unfinishedTasks[index];
    const kratosTask = {
      task: runableKratosTask[unfinishedTask.taskName],
      taskName: unfinishedTask.taskName,
      recoverableTaskId: unfinishedTask.id,
    }
    runKratosTask(kratosTask);
  }
}
