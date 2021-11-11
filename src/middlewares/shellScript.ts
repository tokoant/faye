import { Request, Response, NextFunction } from 'express';
import { buildValidationErrorParams } from '../utils/error';
import fs from 'fs';
import SSH2Promise from 'ssh2-promise';

const promiseFs = fs.promises;
const SCRIPT_PATH = '/Users/antoni.xu/faye/scripts';
const TASK_LOG_PATH  = '/Users/antoni.xu/faye/records/task-logs';
const TARGET_USERNAME = 'antoni.xu';
const TARGET_PRIVATE_KEY_PATH = '/Users/antoni.xu/.ssh/id_ed25519';

const taskSockets:{ [key: string]: any } = {};

const buildShellParams = (scriptParams:{ [key: string]: string }):string => {
  const paramsArr:string[] = [];
  const keys = Object.keys(scriptParams);

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    paramsArr.push(`${key}=${scriptParams[key]}`);
  }

  return paramsArr.join(' ');
};

export const runShellScript = async ( req:Request, _res:Response, next:NextFunction ) => {
  
  const { filename, scriptParams, target } = req.body;
  const { taskId } = req.params;

  const sshconfig = {
    host: target,
    username: TARGET_USERNAME,
    identity: TARGET_PRIVATE_KEY_PATH,
  }
  
  const ssh = new SSH2Promise(sshconfig);

  try {
    await ssh.connect();
  }catch(err){
    console.log(err);
    next(err);
  }

  try {
    const socket = await ssh.shell();
    const logName = `run-shell-script-${taskId}.log`;
    const logFileStream = fs.createWriteStream(`${TASK_LOG_PATH}/${logName}`);

    socket.on('data', (data:Buffer) => {
      logFileStream.write(data);
      if (taskSockets[taskId]) {
        taskSockets[taskId].write(data);
      }
    });

    socket.on('end', () => {
      logFileStream.end();
      if (taskSockets[taskId]) {
        taskSockets[taskId].end();
      }
    });

    socket.write(buildShellParams(scriptParams));
    socket.write(` sh ${SCRIPT_PATH}/${filename} \n`);
    socket.write('exit \n');
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
  
  taskSockets[taskId] = res;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
}
