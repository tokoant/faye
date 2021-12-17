import { Request, Response } from "express";
import { KratosTaskPayload } from '../interfaces'
import getRunWithPayload from '../getRunWithPayload'
import job, { runTest } from './utils/job';
import job2 from './utils/job2';
import  axios from 'axios'
import deploymentEffects from './effects/deploy';

const runDeploy = ()=>{
  const testResult= runTest()
  const dockerImageId = getDockerImage()
  if (testResult.lintOk){
   deployToCloudRun({ dockerImageId})
  }
}

const getDockerImage = async (ctx) => {
  ctx.dockerImageId='shtoenshoetn'
  return
}

const deployToCloudRun =async(ctx)=>{
  runShellScript({ ctx.dockerImageId})
}

const runDeploy = (ctx) => {
  const jobs = [runTest, getDockerImage, deployToCloudRun]
  ctx.runJobs(jobs)
}


/* 
Contract:

Kratos can:
  For any job(promise)
    Provides UI to start/stop
    View logs
    View execution results
    Stream logs
    Scheduled run 
  For jobs using limited resources
    Provides queues to share resources efficiently
  For long running shell script
    will keep it running in case of kratos restart
  For tasks composed of multiple jobs:
    provides framework:
      easy to use, read, understand
      enforcing good code practices in jobs code:
        job isolation
        injection
        no spaghetti code


Kratos requires:
  Job contract:
    A promise factory
    Can be invoked multiple times w/o harm (no ADD to DB, only UPDATE)
    Will be injected with kratos helpers:
      log helper:
        stream
        add log line
      taskId
      parentId
      ...
  Task contract:
    ???
    ?express like
    ?is tree like structure enough to 
    ?how to force non-usage of common context
    ?how to pass info from one job to another in task code
    ???

*/

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
      if (!result) {
        throw new Error('noeneon')
      }
      payload.ctx.jobOneResult = result
    },
    async (payload: KratosTaskPayload) => {
      if (payload.ctx.jobOneResult) {return}
      const result = await job({ ms: 5 })(payload)
      payload.ctx.jobOneResultButAnother = result
    },
    (payload: KratosTaskPayload) => job2({ ms: payload.ctx.jobOneResultButAnother })((payload)),
    (payload: KratosTaskPayload) => job2({ ms: payload.ctx.jobOneResult })((payload)),
   ];

  const result = await magicSequence(jobs);

  res.json(result);
}

export const runDeploy = async (_req: Request, res: Response) => {
  const jobs = [
    async (payload: KratosTaskPayload) => {
      const result = await getDockerManifest({ ms: 5 })(payload)
      payload.ctx.dockerManifest = result
    },
    async (payload: KratosTaskPayload) => {
      if (payload.ctx.dockerManifest) { return }
      const buildResult = await build({ ms: 5, dockerManifest })(payload) //15min
      payload.ctx.buildResult = result
    },
    async (payload: KratosTaskPayload) => {
      if (payload.ctx.dockerManifest) { return }
      if (payload.ctx.buildResult){
        payload.ctx.dockerManifest= await getDockerManifest(payload.ctx.buildResult)(payload)
      } else {
        throw new Error('could not build, cound not find')
      }
    }
  ];

  const result = await magic(jobs);

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