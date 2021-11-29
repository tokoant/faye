import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import SSH2Promise from 'ssh2-promise';
import Tasks from '../state/tasks';

const taskResponseSockets:{ [key: string]: Response } = {};

export const runShellScript = async ( req:Request, res:Response, next:NextFunction ) => {
  const { taskId} = req.params
  const { script, target } = req.body;
  const { logPath } = res.locals.payload;

  const sshconfig = {
    host: target,
    username: process.env.SSH_TARGET_USERNAME,
    identity: process.env.SSH_TARGET_PRIVATE_KEY_PATH,
  }
  
  const sshClient = new SSH2Promise(sshconfig);

  try {
    await sshClient.connect();
  }catch(err){
    console.log(err);
    next(err);
  }

  try {

    const socket = await sshClient.spawn(script);
    const logFileStream = fs.createWriteStream(logPath);

    socket.on('data', (data:Buffer) => {
      // write to log file
      const logObjectString = JSON.stringify({timestamp: (new Date).getTime(), type: 'stdout', line: data.toString() });
      const logBuffer = Buffer.from(`${logObjectString}`, 'utf-8');

      logFileStream.write(logBuffer);

      // write to task response socket if available
      if (taskResponseSockets[taskId]) {
        taskResponseSockets[taskId].write('event:shell-log\n');
        taskResponseSockets[taskId].write(`data:${logObjectString}\n\n`);
      }

      // update task status to "running"
      const taskIdIndex = Tasks.findIndex(({id}) => id === taskId);
      if (taskIdIndex !== -1) Tasks[taskIdIndex].status = 'running';
      console.log(`running task with id ${taskId}`);
    });
    socket.stderr.on('data', (data:Buffer)=>{
      const logObjectString = JSON.stringify({ timestamp: (new Date).getTime(), type: 'stderr', line: data.toString() });
      const logBuffer = Buffer.from(`${logObjectString}`, 'utf-8');

      logFileStream.write(logBuffer);
      if (taskResponseSockets[taskId]) {
        taskResponseSockets[taskId].write('event:shell-log\n');
        taskResponseSockets[taskId].write(`data:${logObjectString}\n\n`);
      }
      
      // update task status to "running"
      const taskIdIndex = Tasks.findIndex(({id}) => id === taskId);
      if (taskIdIndex !== -1) Tasks[taskIdIndex].status = 'running';
      console.log(`running task with id ${taskId}`);
    });
    socket.on('end', () => {
      logFileStream.end();
      if (taskResponseSockets[taskId]){
        taskResponseSockets[taskId].write('event:shell-exec-end\n');
        taskResponseSockets[taskId].write(`data:\n\n`);
        taskResponseSockets[taskId].end();
      }

      // update task status to "ended"
      const taskIdIndex = Tasks.findIndex(({id}) => id === taskId);
      if (taskIdIndex !== -1) Tasks[taskIdIndex].status = 'ended';
      console.log(`finish task with id ${taskId}`);
    });
  }catch(err){
    console.log(err);
    next(err);
  }

  next();
};

export const streamLog = async ( req:Request, res:Response, _next:NextFunction ) => {

  const { taskId } = req.params;
  
  taskResponseSockets[taskId] = res;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
}
