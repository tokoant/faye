import { Request, Response } from "express";
import { KratosTaskPayload } from '../interfaces'
import getRunWithPayload from '../getRunWithPayload'
import job from './utils/job';
import job2 from './utils/job2';


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
