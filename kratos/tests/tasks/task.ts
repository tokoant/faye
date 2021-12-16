import { Request, Response } from "express";
import { KratosTaskPayload } from '../interfaces'
import getRunWithPayload from '../getRunWithPayload'
import job from './utils/job';
import job2 from './utils/job2';
import  axios from 'axios'
import deploymentEffects from './effects/deploy';

export const runTaskNoParams = async (_req:Request, res:Response) => {
  const jobs = ['job', 'jobWithLog'];

  const result = await magic(jobs);

  res.json(result);
}

export const runTaskWithParams= async (_req:Request, res:Response) => {
  const jobs = [job({ms:5})];

  const result = await magic(jobs);

  res.json(result);
}

export const runTasksWithDependentParams= async (_req: Request, res: Response) => {
  const jobs = [
    async (payload: KratosTaskPayload)=>{
      const result = await job({ ms: 5 })(payload)
      payload.ctx.jobOneResult = result
    },
    async (payload: KratosTaskPayload) => {
      const result = await job({ ms: 5 })(payload)
      payload.ctx.jobOneResultButAnother = result
    },
    (payload: KratosTaskPayload) => job2({ ms: payload.ctx.jobOneResultButAnother })((payload)),
    (payload: KratosTaskPayload) => job2({ ms: payload.ctx.jobOneResult })((payload)),
   ];

  const result = await magicSequence(jobs);

  res.json(result);
}


export const runTasksWithALotOfMagic = async (_req: Request, res: Response) => {
  const runWithPayload = getRunWithPayload() 
  try {
    const results = await Promise.all([runWithPayload(job({ ms: 5 })),  runWithPayload(job({ ms: 6 }))])
    const anotherResult = await runWithPayload(job2({ ms: results[1] }));
    const anotherResult2 = await runWithPayload(job2({ ms: results[0] }));
    res.json({ anotherResult2, anotherResult});
  } catch (err) {
    res.json({ error: 'sorry guys runTasksWithALotOfMagic did not work'})
  }
}

const effectCreator = (runWithPayload: any) => {
  
  const effectKeys = Object.keys(deploymentEffects);

  const contextifyEffects:Record<string, any> = {};

  for (let index = 0; index < effectKeys.length; index++) {
    const effectKey = effectKeys[index];
    contextifyEffects[effectKey] = runWithPayload(deploymentEffects[effectKey]);
  }

  return contextifyEffects;
};


// nb: we implement it on express middleware, that have it on res.locals
export const runTasksWithALotOfMagicAndCanBeRestore = async (_req: Request, res: Response) => {

    const runWithPayload = getRunWithPayload();
    const effects = effectCreator(runWithPayload);

    try {

      const results = await Promise.all([ effects.job({ ms: 5 }), effects.job({ ms: 6 }) ]);
      const anotherResult = await effects.job2({ ms: results[1] });
      const anotherResult2 = await effects.job2({ ms: results[0] });

      res.json({ anotherResult2, anotherResult });
    } catch (err) {
      res.json({ error: 'sorry guys runTasksWithALotOfMagic did not work'});
    }
}


// High level API:
// Needed context on runtime
//    -> provided context hook that can be called
// Flow of execution will be leaved to developer to be implemented
//    -> provided helper to serialize the subtask
// It can be restore on fail
//    -> 

const magicState ={
  step: 1,
  parentId:
  // done: 
}

const getMagic =(initialState)=>{
  // create an id
  // store magicState in redux 
  // return magic function and it can inject context
    // on magic
      // inject context
      // update its magicState
      // increment step++
      // creates a lot of state to restore this JOB/UTIL
}

const createGetMagic = (magicState = {}) => ()=>{
  
}

export const runTasksWithALotOfMagicAndCanBeRestoreAndAlmostNoContract = (getMagic) => async (_req: Request, res: Response) => {
  const magic = getMagic();

  try {
    const results = await Promise.all([magic(job, { ms: 5 }), magic(job,{ ms: 6 })]);
    const currentFeatureNumber = await axios.get(`freeFeatureNumber/${results}`);
    let result
    if (currentFeatureNumber > 10) {
      result = await magic(deployJob, { ms: results[1], currentFeatureNumber });
    } else {
      result = await magic(deployJob, { ms: results[1], currentFeatureNumber });
      result = await magic(deployJob, { ms: results[1], currentFeatureNumber });
    }

    res.json(result);
  } catch (err) {
    res.json({ error: 'sorry guys runTasksWithALotOfMagic did not work' });
  }
}



export const runTasksWithNext = (getMagic) => async (_req: Request, res: Response) => {
  const nextMagic = getNext();
  

  nextMagic(async (ctx)=>{
    const currentFeatureNumber = await axios.get(`freeFeatureNumber/${ctx}`);
  })
  if (currentFeatureNumber > 10) {
    nextMagic(() => { })
  } else {
    nextMagic(() => { })
  }



  try {
    const results = await Promise.all([magic(job, { ms: 5 }), magic(job, { ms: 6 })]);
    const currentFeatureNumber = await axios.get(`freeFeatureNumber/${results}`);
    let result
    if (currentFeatureNumber > 10) {
      result = await magic(deployJob, { ms: results[1], currentFeatureNumber });
    } else {
      result = await magic(deployJob, { ms: results[1], currentFeatureNumber });
      result = await magic(deployJob, { ms: results[1], currentFeatureNumber });
    }

    res.json(result);
  } catch (err) {
    res.json({ error: 'sorry guys runTasksWithALotOfMagic did not work' });
  }
}