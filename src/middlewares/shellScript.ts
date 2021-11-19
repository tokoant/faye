import { Request, Response, NextFunction } from 'express';
import { buildValidationErrorParams } from '../utils/error';
import fs from 'fs';
import SSH2Promise from 'ssh2-promise';

const promiseFs = fs.promises;
const SCRIPT_PATH = '/Users/antoni.xu/faye/scripts';
const TARGET_USERNAME = 'antoni.xu';
const TARGET_PRIVATE_KEY_PATH = '/Users/antoni.xu/.ssh/id_ed25519';

const taskResponseSockets:{ [key: string]: Response } = {};

export const runShellScript = async ( req:Request, res:Response, next:NextFunction ) => {
  
  const { script, target } = req.body;
  const { taskId, logPath } = res.locals.payload;

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
      const logObject = JSON.stringify({timestamp: (new Date).getTime(), type: 'stdout', line: data.toString() });
      const logBuffer = Buffer.from(`${logObject} \n`, 'utf-8');

      logFileStream.write(logBuffer);

      // write to task response socket if available
      const strData = data.toString();
      // console.log(strData, 'strData')
      if (taskResponseSockets[taskId]) {
        const payload = `data:${strData}\n`;
        taskResponseSockets[taskId].write(payload);
      }
    });
    socket.stderr.on('data', (data:Buffer)=>{

      const logObject = JSON.stringify({timestamp: (new Date).getTime(), type: 'stderr', line: data.toString() });
      const logBuffer = Buffer.from(`${logObject} \n`, 'utf-8');

      logFileStream.write(logBuffer);

      // write it in separate error log file
      // const bufferErrorMarker = Buffer.from("Script Execution Error: \n", "utf-8");
      // const errorLogFileStream = fs.createWriteStream(errorLogPath);
      // errorLogFileStream.write(bufferErrorMarker);
      // errorLogFileStream.write(data);
      // errorLogFileStream.end();
    });
    socket.on('end', () => {
      logFileStream.end();
    });
  }catch(err){
    console.log(err);
    next(err);
  }

  next();
};

export const checkShellScriptAvailability = async ( req:Request, _res:Response, next:NextFunction ) => {

  const { filename } = req.body;

  let shellFile;

  try {
    shellFile = await promiseFs.readFile(`${SCRIPT_PATH}/${filename}`);
  }catch(err){
    console.log(err);
  } 

  if (!shellFile){
    next(buildValidationErrorParams('no shell script found with that name'));
  }

  next();
}

export const streamLog = async ( req:Request, res:Response, _next:NextFunction ) => {

  const { taskId } = req.params;
  
  taskResponseSockets[taskId] = res;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
}
