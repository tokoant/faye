import { runShellScript, getRunningScriptLiveLog } from './sshConn';
import fs from 'fs';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

const promiseFs = fs.promises;

export const runSlowScript = async (_req: Request, res: Response) => {
    const slowScript = (await promiseFs.readFile(`${__dirname}/slow.sh`)).toString();

    const taskId = new mongoose.Types.ObjectId();

    const SSEhandler = await getRunningScriptLiveLog({ taskId });

    SSEhandler.onmessage = (event) => {
        console.log('SSE data:',event.data,);
    };

    const params = {
        taskId,
        target: '127.0.0.1',
        script: slowScript,
    };

    await runShellScript(params);

    // console.log(data);
    res.json({
        params,
    });
};
