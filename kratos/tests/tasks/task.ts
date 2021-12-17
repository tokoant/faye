import { Request, Response } from "express";
import { KratosTaskPayload } from '../interfaces'
import getRunWithPayload from '../getRunWithPayload'
import job, { runTest } from './utils/job';
import job2 from './utils/job2';
import  axios from 'axios'
import deploymentEffects from './effects/deploy';
import { dispatch } from "d3-dispatch";

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
    View start, stop, duration times, and status(fail/ok)
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
    Running not too long or if long has to be indempotent (no ADD to DB, only UPDATE)
    A promise factory
    Can be invoked multiple times w/o harm 
    Will be injected with kratos helpers:
      log helper:
        stream
        add log line
      taskId
      parentId
      ...
  Task contract:
    no side effects
    no random
    no http calls
    no await

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


export const runDeploy = async (_req: Request, res: Response) => {
  
  //lets deploy something
  //by running a sequence of promises
  const jobs = [
    async (payload: KratosTaskPayload) => {
      try {
      const result = await getDockerManifest({ ms: 5 })(payload)
      payload.ctx.dockerManifest = result
      } catch {
        return
      }
      // payload.ctx.resolveTaskAndSkipAllOtherSteps({})
    },
    async (payload: KratosTaskPayload) => {
      if (payload.ctx.dockerManifest) { 
        //no need to build skip to next
        return 
      }
      const buildResult = await runShellScript({ script: 'build.sh',target:'' })(payload) //15min
      payload.ctx.buildResult = result
    },
    async (payload: KratosTaskPayload) => {
      if (payload.ctx.dockerManifest) { return }
      if (payload.ctx.buildResult && !payload.ctx.dockerManifest) {
        payload.ctx.dockerManifest = await getDockerManifest(payload.ctx.buildResult)(payload)
      } else {
        throw new Error('could not build, cound not find');
      }
    },
    async (payload: KratosTaskPayload) => {
      if (payload.ctx.dockerManifest) {
        await deployToCloudRun(payload.ctx.dockerManifest)
      }
    }
  ];

  const result = await magic(jobs);

  res.json(result);
}


const taskMagic = (task)=>{
  // task.toString().find(!'await payload')
}

export const runDeployInSingleStep = async (_req: Request, res: Response) => {

  const task = async (payload: KratosTaskPayload) => {
    const { magic } =payload
      let dockerManifest
      try {
        dockerManifest = await magic(getDockerManifest({ ms: 5 }))
      } catch {
        const buildResult = await magic(runShellScript({ script: 'build.sh', target: '' }));
        // kratos restart
        dockerManifest = await magic(getDockerManifest(buildResult));
        return
      }
      const random = await magic(getRandom())
      await magic(deployToCloudRun(dockerManifest, random)
    };

  const result = await magic(task);

  res.json(result);
}


export const runDeployInRedux = async (_req: Request, res: Response) => {
 dispatch({ type:'runDeploy', feature:''})
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


