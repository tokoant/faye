import { runShellScript, getRunningScriptLiveLog } from '../sshConn';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { taskStore, Task } from '../state/task';
import streamResponse from '../state/streamResponse';
import mongoose from 'mongoose';

const promiseFs = fs.promises;

export const runScript = async (req: Request, res: Response, next: NextFunction) => {
    const shellScript = (await promiseFs.readFile(`${__dirname}/../scripts/${req.body.script}`)).toString();

    const taskId = new mongoose.Types.ObjectId();

    
    const SSEhandler = await getRunningScriptLiveLog({ taskId });
    SSEhandler.addEventListener('shell-log', (event)=>{
        if (streamResponse[taskId.toString()]) {
            streamResponse[taskId.toString()].write('event:kratos-shell-log\n');
            streamResponse[taskId.toString()].write(`data:${event.data}\n\n`);
        }

        // save current running state as task stream back the log 
        taskStore.dispatch({ type: 'task/running', payload: { taskId, log: event.data }});
    });
    SSEhandler.addEventListener('shell-exec-end', ()=>{
        if (streamResponse[taskId.toString()]){
            streamResponse[taskId.toString()].end();
        }

        // resolve current task as shell execution give a finished signal 
        taskStore.dispatch({ type: 'task/resolved', payload: { taskId }});
    });

    const params = {
        taskId,
        target: req.body.target, 
        script: shellScript,
    };

    const { data: runShellScriptResult } = await runShellScript(params);

    // save the newly created task 
    const { id, options } = runShellScriptResult;
    taskStore.dispatch({ type: 'task/create' , payload: {
        taskId: id,
        ...options
    }});

    res.locals.payload = params;
    next();
};

export const getScriptLog = (req: Request, res: Response) => {
    const { taskId: currentTaskId } = req.params;
    
    // check if task status is ended
    const tasks:Task[] = taskStore.getState();
    const task = tasks.find(({ taskId }) => taskId.toString() === currentTaskId);

    if (task && task.status === 'ended'){
        res.status(200);
        res.json({info: 'task ended'});
    }else{
        streamResponse[currentTaskId] = res;
  
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
    }
}
