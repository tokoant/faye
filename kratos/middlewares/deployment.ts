import { Request, Response } from 'express';
import { runKratosTask } from '../utils/kratosTask';
import deployTask from '../tasks/deploy';

export const runDeploy = async (_req:Request, res:Response) => {
  runKratosTask({ task: deployTask });
  res.json('run recoverable deployment');
}
