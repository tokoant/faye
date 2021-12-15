import { Request, Response } from "express";
import magic from './magic';

export const runTaskNoParams = async (_req:Request, res:Response) => {
  const jobs = ['job', 'jobWithLog'];

  const result = await magic(jobs);

  res.json(result);
}

export const runTask= async (_req:Request, res:Response) => {
  const jobs = ['job', 'jobWithLog'];

  const result = await magic(jobs);

  res.json(result);
}
