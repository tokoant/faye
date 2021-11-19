import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import SSH2Promise from 'ssh2-promise';

const TARGET_USERNAME = 'y';
const TARGET_PRIVATE_KEY_PATH = `/Users/y/.ssh/mini2021`;

const taskResponseSockets:{ [key: string]: Response } = {};

export const runShellScript = async ( req:Request, res:Response, next:NextFunction ) => {
  const { taskId} = req.params
  const { script, target } = req.body;
  const { logPath } = res.locals.payload;

  const sshconfig = {
    host: target,
    username: TARGET_USERNAME,
    identity: TARGET_PRIVATE_KEY_PATH,
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
      const logBuffer = Buffer.from(`${logObjectString} \n`, 'utf-8');

      logFileStream.write(logBuffer);

      // write to task response socket if available
      const strData = data.toString();
     
      if (taskResponseSockets[taskId]) {

        taskResponseSockets[taskId].write(logObjectString);
      }
    });
    socket.stderr.on('data', (data:Buffer)=>{
      const logObjectString = JSON.stringify({ timestamp: (new Date).getTime(), type: 'stdout', line: data.toString() });
      const logBuffer = Buffer.from(`${logObjectString} \n`, 'utf-8');

      logFileStream.write(logBuffer);
      if (taskResponseSockets[taskId]) {
        taskResponseSockets[taskId].write(logObjectString);
      }
    });
    socket.on('end', () => {
      logFileStream.end();
      taskResponseSockets[taskId].end();
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
