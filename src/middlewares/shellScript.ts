import { Request, Response, NextFunction } from 'express';
import { buildValidationErrorParams } from '../utils/error';
import fs from 'fs';
import SSH2Promise from 'ssh2-promise';

const promiseFs = fs.promises;
const SCRIPT_PATH = '/Users/antoni.xu/faye/scripts';
const TASK_LOG_PATH  = '/Users/antoni.xu/faye/records/task-logs';
const TARGET_USERNAME = 'antoni.xu';
const TARGET_PRIVATE_KEY_PATH = '/Users/antoni.xu/.ssh/id_ed25519';

const taskSockets:{ [key: string]: any; } = {};

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
    socket.write(buildShellParams(scriptParams));
    socket.write(` sh ${SCRIPT_PATH}/${filename}`);
    socket.write('\n');
    socket.on('data', (data:Buffer) => {
      writeLogToFile({ taskId, data });
    });
    taskSockets[taskId.toString()] = socket;
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
  let socketIntervalCheck: any;
  let anySocketConnection:boolean = false;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const checkSocketConnection = () => {
    const socket = taskSockets[taskId];
    if (socket){
      console.log(socket, "anySocket")
      socket.on('data', (data:Buffer) => {
        res.write("data: " + data.toString() + "\n\n");
        //TODO: check if already on the on of shell process, if yes than the api response
      });
      anySocketConnection = true;
    }
  };

  if (!anySocketConnection){
    socketIntervalCheck = setInterval(()=>{
      if (anySocketConnection){
        clearInterval(socketIntervalCheck);
      }else{
        checkSocketConnection();
      }
    }, 2000);
  }
  
}

interface WriteLogToFileParams {
  taskId: string,
  data: Buffer,
}
const writeLogToFile = async (params:WriteLogToFileParams) => {

  /* 
    NB: task log naming convention
    run-shell-script-[taskId].log
  */
  const { taskId, data } = params;
  const filename = `run-shell-script-${taskId}.log`;

  let anyFile = false;
  try {
    await promiseFs.open(`${TASK_LOG_PATH}/${filename}`, 'r');
    anyFile = true;
  }catch(err){
    console.log(err);
  }

  if (!anyFile){
    // if no log file related to current task, create the file
    await promiseFs.writeFile(`${TASK_LOG_PATH}/${filename}`, data.toString());
  }else{
    // if there is a log file append current data to the log
    await promiseFs.appendFile(`${TASK_LOG_PATH}/${filename}`, data.toString());
  }
}
