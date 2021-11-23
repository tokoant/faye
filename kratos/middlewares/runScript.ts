import { runShellScript, getRunningScriptLiveLog } from '../sshConn';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import { runningTaskStore, saveStateToFile } from '../state/runningTask';

const promiseFs = fs.promises;

export const runScript = async (req: Request, res: Response, next: NextFunction) => {
    const unsubscribeStore = runningTaskStore.subscribe(() => saveStateToFile(runningTaskStore.getState()));

    runningTaskStore.dispatch({ type: 'runningTask/decremented' });

    const shellScript = (await promiseFs.readFile(`${__dirname}/../scripts/${req.body.script}`)).toString();

    const taskId = new mongoose.Types.ObjectId();

    const SSEhandler = await getRunningScriptLiveLog({ taskId });

    SSEhandler.onmessage = (event) => {
        console.log('SSE data:', event.data);
    };

    const params = {
        taskId,
        target: '127.0.0.1',
        script: shellScript,
    };

    await runShellScript(params);
    
    res.locals.payload = params;
    unsubscribeStore();
    next();
};
